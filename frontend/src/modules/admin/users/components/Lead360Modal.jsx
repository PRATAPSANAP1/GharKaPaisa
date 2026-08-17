import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { useTheme, makeS } from '../../../../contexts/ThemeContext';
import { 
  MdClose, MdPerson, MdCreditCard, MdDescription, MdTimeline, 
  MdNote, MdHistory, MdAccountBalanceWallet, MdCheckCircle,
  MdPhone, MdEmail, MdWork, MdBadge, MdLock,
  MdVerifiedUser, MdAccountBalance, MdLocationOn, MdAssignmentInd,
  MdOutlineCloudDownload
} from 'react-icons/md';

export default function Lead360Modal({ leadId, onClose, onRefresh }) {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Status & Stage state
  const [pipelineStage, setPipelineStage] = useState('created');
  const [status, setStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Bank Assignment Form
  const [execName, setExecName] = useState('');
  const [execMobile, setExecMobile] = useState('');
  const [execEmail, setExecEmail] = useState('');
  const [assigningBank, setAssigningBank] = useState(false);

  // Note Form State
  const [noteText, setNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('partner');
  const [addingNote, setAddingNote] = useState(false);

  const fetch360Data = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await api.get(`/leads/${leadId}`);
      if (res.data?.success) {
        setData(res.data.data);
        const ov = res.data.data.overview || {};
        setPipelineStage(ov.pipeline_stage || 'created');
        setStatus(ov.status || 'pending');
        setRejectionReason(ov.rejection_reason || '');
      }
    } catch (err) {
      console.error('Failed to load lead 360 overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch360Data();
  }, [leadId]);

  if (!leadId) return null;

  const handleStageTransition = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const targetStage = newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : newStatus === 'submitted' ? 'bank' : 'created';
      const res = await api.patch(`/leads/${leadId}/status`, {
        status: newStatus,
        pipeline_stage: targetStage,
        rejection_reason: newStatus === 'rejected' ? rejectionReason : undefined
      });
      if (res.data?.success) {
        setStatus(newStatus);
        setPipelineStage(targetStage);
        fetch360Data();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update lead status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignBankExec = async (e) => {
    e.preventDefault();
    if (!execName.trim()) return alert('Executive Name is required');
    setAssigningBank(true);
    try {
      const bankId = data?.overview?.bank_id;
      const res = await api.post(`/leads/${leadId}/bank-assign`, {
        bank_id: bankId,
        executive_name: execName,
        mobile: execMobile,
        email: execEmail
      });
      if (res.data?.success) {
        setExecName('');
        setExecMobile('');
        setExecEmail('');
        fetch360Data();
      }
    } catch (err) {
      alert('Failed to assign bank executive');
    } finally {
      setAssigningBank(false);
    }
  };

  const handleAddNote = async (e, isPrivate = false) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const endpoint = isPrivate ? `/leads/${leadId}/internal-note` : `/leads/${leadId}/note`;
      const res = await api.post(endpoint, {
        note: noteText,
        visibility: isPrivate ? 'private' : noteVisibility
      });
      if (res.data?.success) {
        setNoteText('');
        fetch360Data();
      }
    } catch (err) {
      alert('Failed to record note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleToggleChecklist = async (item, currentStatus) => {
    const nextStatus = currentStatus === 'verified' ? 'pending' : 'verified';
    try {
      const res = await api.post(`/leads/${leadId}/checklist`, { item, status: nextStatus });
      if (res.data?.success) fetch360Data();
    } catch (err) {
      alert('Failed to update checklist item');
    }
  };

  const { overview = {}, documents = [], timeline = [], status_history = [], notes = [], bank_assignment = null, checklist = [], commission_ledger = null, customer_cards = [] } = data || {};

  const getStatusBadge = (st) => {
    switch (st) {
      case 'approved':
        return { bg: '#DCFCE7', color: '#15803D', label: 'APPROVED & DISBURSED' };
      case 'rejected':
        return { bg: '#FEE2E2', color: '#B91C1C', label: 'REJECTED' };
      case 'submitted':
        return { bg: '#E0E7FF', color: '#4338CA', label: 'SUBMITTED TO BANK' };
      case 'under_review':
        return { bg: '#FEF3C7', color: '#B45309', label: 'BANK UNDER REVIEW' };
      default:
        return { bg: '#F1F5F9', color: '#475569', label: 'PENDING REVIEW' };
    }
  };

  const currentBadge = getStatusBadge(status);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        height: '100%',
        background: isDark ? '#0F172A' : '#FFFFFF',
        color: isDark ? '#F8FAFC' : '#0F172A',
        boxShadow: '-12px 0 36px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        
        {/* Sleek Gradient Header */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              fontSize: '22px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
            }}>
              {(overview.customer_name || 'L')[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  LEAD ID #{leadId ? leadId.substring(0, 8).toUpperCase() : ''}
                </span>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: currentBadge.bg,
                  color: currentBadge.color
                }}>
                  {currentBadge.label}
                </span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {overview.customer_name || 'Loading...'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Status Change Selector */}
            <div style={{ display: 'flex', flexDir: 'column', gap: '2px' }}>
              <select
                value={status}
                onChange={(e) => handleStageTransition(e.target.value)}
                disabled={updatingStatus}
                style={{
                  background: '#1E293B',
                  color: '#FFFFFF',
                  border: '1.5px solid #334155',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="pending" style={{ background: '#1E293B', color: '#FFF' }}>🟡 Pending Review</option>
                <option value="submitted" style={{ background: '#1E293B', color: '#FFF' }}>🟣 Submitted to Bank</option>
                <option value="under_review" style={{ background: '#1E293B', color: '#FFF' }}>🟠 Bank Under Review</option>
                <option value="approved" style={{ background: '#1E293B', color: '#FFF' }}>🟢 Approved & Disbursed</option>
                <option value="rejected" style={{ background: '#1E293B', color: '#FFF' }}>🔴 Rejected</option>
              </select>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#FFF',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <MdClose style={{ fontSize: '22px' }} />
            </button>
          </div>
        </div>

        {/* Clean Essential Tabs Bar */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          background: isDark ? '#1E293B' : '#F8FAFC',
          borderBottom: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          padding: '6px 16px',
          gap: '6px'
        }}>
          {[
            { id: 'overview', label: 'Lead Details', icon: MdPerson },
            { id: 'customer_cards', label: `Interested Cards (${customer_cards.length})`, icon: MdCreditCard },
            { id: 'checklist', label: `Checklist (${checklist.filter(c => c.status === 'verified').length}/${checklist.length})`, icon: MdVerifiedUser },
            { id: 'documents', label: `Documents (${documents.length})`, icon: MdDescription },
            { id: 'timeline', label: `Activity Stream (${timeline.length})`, icon: MdTimeline },
            { id: 'bank_assign', label: 'Bank Executive', icon: MdAccountBalance },
            { id: 'notes', label: `Admin Notes (${notes.length})`, icon: MdNote },
            { id: 'commission', label: 'Payout & Wallet', icon: MdAccountBalanceWallet },
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
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: active ? '#2563EB' : 'transparent',
                  color: active ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')
                }}
              >
                <Icon style={{ fontSize: '18px', color: active ? '#FFFFFF' : (isDark ? '#64748B' : '#94A3B8') }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: isDark ? '#94A3B8' : '#64748B' }}>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Loading 360° Lead Profile...</div>
            </div>
          ) : (
            <>
              {/* TAB 1: LEAD OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Summary Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    
                    {/* Customer Profile Card */}
                    <div style={{
                      background: isDark ? '#1E293B' : '#F8FAFC',
                      borderRadius: '16px',
                      padding: '20px',
                      border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, paddingBottom: '10px' }}>
                        <MdPerson style={{ fontSize: '20px', color: '#2563EB' }} />
                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#F8FAFC' : '#0F172A' }}>Customer Details</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Full Name:</span>
                          <span style={{ fontWeight: 700 }}>{overview.customer_name || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Mobile:</span>
                          <span style={{ fontWeight: 700 }}>{overview.mobile || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Email:</span>
                          <span style={{ fontWeight: 700 }}>{overview.customer_email || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>PAN Number:</span>
                          <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>{overview.pan_number || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>City / Location:</span>
                          <span style={{ fontWeight: 700 }}>{overview.city || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Employment:</span>
                          <span style={{ fontWeight: 700 }}>{overview.employment_type || 'Salaried'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Product & Bank Details Card */}
                    <div style={{
                      background: isDark ? '#1E293B' : '#F8FAFC',
                      borderRadius: '16px',
                      padding: '20px',
                      border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, paddingBottom: '10px' }}>
                        <MdCreditCard style={{ fontSize: '20px', color: '#10B981' }} />
                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#F8FAFC' : '#0F172A' }}>Product & Bank Info</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Bank Partner:</span>
                          <span style={{ fontWeight: 700, color: '#10B981' }}>{overview.bank_name || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Product Name:</span>
                          <span style={{ fontWeight: 700 }}>{overview.product_name || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Category:</span>
                          <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{(overview.product_category || 'Credit Card').replace('_', ' ')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Lead Priority:</span>
                          <span style={{ fontWeight: 800, color: overview.priority === 'high' ? '#EF4444' : '#10B981', textTransform: 'uppercase' }}>
                            {overview.priority || 'MEDIUM'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Origin Source:</span>
                          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{overview.source || 'PARTNER'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Created Date:</span>
                          <span style={{ fontWeight: 700 }}>{overview.created_at ? new Date(overview.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Partner & Origin Card */}
                    <div style={{
                      background: isDark ? '#1E293B' : '#F8FAFC',
                      borderRadius: '16px',
                      padding: '20px',
                      border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, paddingBottom: '10px' }}>
                        <MdAssignmentInd style={{ fontSize: '20px', color: '#8B5CF6' }} />
                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#F8FAFC' : '#0F172A' }}>Partner & Attribution</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Partner Code:</span>
                          <span style={{ fontWeight: 800, color: '#8B5CF6' }}>{overview.partner_code || 'DIRECT'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Partner Name:</span>
                          <span style={{ fontWeight: 700 }}>{`${overview.partner_first_name || ''} ${overview.partner_last_name || ''}`.trim() || 'Direct Customer'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Estimated Payout:</span>
                          <span style={{ fontWeight: 800, color: '#10B981' }}>₹{overview.commission_value || '0'}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: VERIFICATION CHECKLIST */}
              {activeTab === 'checklist' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Lead Verification Checklist</h3>
                    <span style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700 }}>
                      {checklist.filter(c => c.status === 'verified').length} of {checklist.length} items verified
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {checklist.map(item => (
                      <div key={item.id} style={{
                        background: isDark ? '#1E293B' : '#F8FAFC',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
                      }}>
                        <div>
                          <div style={{ fontSize: '14.5px', fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>{item.item}</div>
                          <div style={{ fontSize: '11.5px', color: isDark ? '#94A3B8' : '#64748B', marginTop: '4px' }}>
                            {item.verified_at ? `Verified by ${item.verifier_name || 'Staff'} on ${new Date(item.verified_at).toLocaleDateString('en-IN')}` : 'Pending manual staff verification'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleChecklist(item.item, item.status)}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: item.status === 'verified' ? '#DCFCE7' : '#F1F5F9',
                            color: item.status === 'verified' ? '#15803D' : '#475569'
                          }}
                        >
                          {item.status === 'verified' ? '✔ VERIFIED' : 'MARK VERIFIED'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Document Vault ({documents.length})</h3>

                  {documents.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', background: isDark ? '#1E293B' : '#F8FAFC', borderRadius: '16px', border: `1px dashed ${isDark ? '#334155' : '#CBD5E1'}` }}>
                      <MdDescription style={{ fontSize: '40px', color: isDark ? '#64748B' : '#94A3B8', marginBottom: '8px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B' }}>No documents uploaded for this lead yet.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                      {documents.map(d => (
                        <div key={d.id} style={{
                          background: isDark ? '#1E293B' : '#F8FAFC',
                          borderRadius: '14px',
                          padding: '16px',
                          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justify: 'space-between'
                        }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', textTransform: 'uppercase', marginBottom: '4px' }}>
                              {d.document_type.replace('_', ' ')}
                            </div>
                            <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                              {(d.verification_status || 'VERIFIED').toUpperCase()}
                            </span>
                          </div>

                          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B' }}>
                              {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString('en-IN') : ''}
                            </span>
                            <a 
                              href={d.file_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{
                                fontSize: '12.5px',
                                color: '#2563EB',
                                fontWeight: 800,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Preview <MdOutlineCloudDownload />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTIVITY TIMELINE */}
              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Activity Stream & Audit History</h3>

                  {timeline.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B' }}>No activity logged yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {timeline.map((t, idx) => (
                        <div key={t.id || idx} style={{
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'flex-start',
                          background: isDark ? '#1E293B' : '#F8FAFC',
                          borderRadius: '12px',
                          padding: '16px',
                          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
                        }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#2563EB',
                            marginTop: '6px',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>{t.title}</span>
                              <span style={{ fontSize: '11.5px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>{new Date(t.created_at).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: isDark ? '#CBD5E1' : '#475569' }}>{t.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: BANK EXECUTIVE */}
              {activeTab === 'bank_assign' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{
                    background: isDark ? '#1E293B' : '#F8FAFC',
                    borderRadius: '16px',
                    padding: '20px',
                    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
                  }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      Currently Assigned Executive
                    </h4>
                    {bank_assignment ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13.5px' }}>
                        <div>Executive: <strong>{bank_assignment.executive_name}</strong></div>
                        <div>Mobile: <strong>{bank_assignment.mobile || 'N/A'}</strong></div>
                        <div>Email: <strong>{bank_assignment.email || 'N/A'}</strong></div>
                        <div>Assigned Date: <strong>{new Date(bank_assignment.assigned_at).toLocaleDateString('en-IN')}</strong></div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13.5px', color: isDark ? '#94A3B8' : '#64748B' }}>No bank executive assigned to this lead yet.</div>
                    )}
                  </div>

                  {/* Assign Form */}
                  <form onSubmit={handleAssignBankExec} style={{
                    background: isDark ? '#1E293B' : '#F8FAFC',
                    borderRadius: '16px',
                    padding: '20px',
                    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      Assign / Reassign Bank Executive
                    </h4>
                    <input 
                      style={{ ...S.input, background: isDark ? '#0F172A' : '#FFFFFF' }} 
                      placeholder="Executive Full Name *" 
                      value={execName} 
                      onChange={(e) => setExecName(e.target.value)} 
                    />
                    <input 
                      style={{ ...S.input, background: isDark ? '#0F172A' : '#FFFFFF' }} 
                      placeholder="Mobile Number" 
                      value={execMobile} 
                      onChange={(e) => setExecMobile(e.target.value)} 
                    />
                    <input 
                      style={{ ...S.input, background: isDark ? '#0F172A' : '#FFFFFF' }} 
                      placeholder="Email Address" 
                      value={execEmail} 
                      onChange={(e) => setExecEmail(e.target.value)} 
                    />
                    <button 
                      type="submit" 
                      disabled={assigningBank} 
                      style={{ ...S.btn('primary'), background: '#2563EB', padding: '10px 20px', borderRadius: '10px', alignSelf: 'flex-start' }}
                    >
                      {assigningBank ? 'Assigning...' : 'Assign Executive'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 6: ADMIN NOTES */}
              {activeTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <form onSubmit={(e) => handleAddNote(e, true)} style={{ display: 'flex', gap: '12px' }}>
                    <input 
                      style={{ ...S.input, flex: 1, background: isDark ? '#1E293B' : '#FFFFFF' }} 
                      placeholder="Type admin note or remark..." 
                      value={noteText} 
                      onChange={(e) => setNoteText(e.target.value)} 
                    />
                    <button 
                      type="submit" 
                      disabled={addingNote} 
                      style={{ ...S.btn('primary'), background: '#2563EB', padding: '10px 20px', borderRadius: '10px' }}
                    >
                      Save Note
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notes.map(n => (
                      <div key={n.id} style={{
                        background: isDark ? '#1E293B' : '#F8FAFC',
                        borderRadius: '12px',
                        padding: '16px',
                        borderLeft: `4px solid ${n.visibility === 'private' ? '#EF4444' : '#2563EB'}`,
                        borderTop: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                        borderRight: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                        borderBottom: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B', marginBottom: '6px' }}>
                          <span>Logged by {n.author_name || 'Admin'}</span>
                          <span>{new Date(n.created_at).toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ fontSize: '13.5px', color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: 600 }}>{n.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: COMMISSION & PAYOUT */}
              {activeTab === 'commission' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    background: isDark ? '#1E293B' : '#F8FAFC',
                    borderRadius: '16px',
                    padding: '24px',
                    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      Commission & Wallet Ledger
                    </h3>

                    {commission_ledger ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700 }}>EARNED COMMISSION</div>
                          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                            ₹{parseFloat(commission_ledger.commission_earned || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700 }}>COMMISSION RATE</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>
                            {commission_ledger.commission_rate}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700 }}>LEDGER STATUS</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#2563EB', marginTop: '4px', textTransform: 'uppercase' }}>
                            {commission_ledger.status || 'PENDING APPROVAL'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13.5px', color: isDark ? '#94A3B8' : '#64748B' }}>
                        Commission ledger entry will generate automatically upon bank approval.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: CUSTOMER INTERESTED CARDS */}
              {activeTab === 'customer_cards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                      Cards & Applications for Mobile: {overview.mobile} ({customer_cards.length})
                    </h3>
                  </div>

                  {customer_cards.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', background: isDark ? '#1E293B' : '#F8FAFC', borderRadius: '16px', border: `1px dashed ${isDark ? '#334155' : '#CBD5E1'}` }}>
                      <MdCreditCard style={{ fontSize: '40px', color: isDark ? '#64748B' : '#94A3B8', marginBottom: '8px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B' }}>No other cards found for this customer number.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      {customer_cards.map((card, idx) => (
                        <div key={card.id || idx} style={{
                          background: isDark ? '#1E293B' : '#F8FAFC',
                          borderRadius: '16px',
                          padding: '20px',
                          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>{card.product_name || 'Card Product'}</div>
                              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>{card.bank_name || 'Bank Partner'}</div>
                            </div>
                            <span style={{
                              fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                              background: '#2563EB15', color: '#2563EB', textTransform: 'uppercase'
                            }}>
                              {(card.status || 'PENDING').replace('_', ' ')}
                            </span>
                          </div>

                          <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>App / Lead Number:</span>
                              <strong style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>#{card.app_number}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Category:</span>
                              <strong style={{ textTransform: 'capitalize' }}>{(card.product_category || 'Credit Card').replace('_', ' ')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Process Type:</span>
                              <strong style={{ textTransform: 'capitalize' }}>{(card.process_type || 'lead_punching').replace('_', ' ')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Applied Date:</span>
                              <strong>{card.created_at ? new Date(card.created_at).toLocaleDateString('en-IN') : 'N/A'}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </div>

      </div>
    </div>
  );
}
