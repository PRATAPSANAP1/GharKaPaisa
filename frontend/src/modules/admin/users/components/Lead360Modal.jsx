import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { useTheme, makeS } from '../../../../contexts/ThemeContext';
import { 
  MdClose, MdPerson, MdCreditCard, MdDescription, MdTimeline, 
  MdNote, MdAlarm, MdHistory, MdAccountBalanceWallet, MdCheckCircle,
  MdPhone, MdEmail, MdWork, MdBadge, MdLock, MdCloudUpload, MdSend,
  MdArrowForward, MdGroupAdd, MdWarning, MdVerifiedUser, MdAccountBalance
} from 'react-icons/md';

export default function Lead360Modal({ leadId, onClose, onRefresh }) {
  const { C } = useTheme();
  const S = makeS(C);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, documents, checklist, timeline, history, bank_assign, notes, internal_notes, commission

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

  const handleStageTransition = async (newStatus, newStage) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/leads/${leadId}/status`, {
        status: newStatus,
        pipeline_stage: newStage,
        rejection_reason: newStatus === 'rejected' ? rejectionReason : undefined
      });
      if (res.data?.success) {
        setStatus(newStatus);
        setPipelineStage(newStage);
        fetch360Data();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to transition stage');
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
    const nextStatus = currentStatus === 'verified' ? 'failed' : 'verified';
    try {
      const res = await api.post(`/leads/${leadId}/checklist`, { item, status: nextStatus });
      if (res.data?.success) fetch360Data();
    } catch (err) {
      alert('Failed to update checklist item');
    }
  };

  const { overview = {}, documents = [], timeline = [], status_history = [], notes = [], assignments = [], bank_assignment = null, checklist = [], commission_ledger = null } = data || {};

  const pipelineStages = [
    { key: 'created', label: 'Created' },
    { key: 'documents', label: 'Documents' },
    { key: 'verification', label: 'Verification' },
    { key: 'bank', label: 'Bank Processing' },
    { key: 'approved', label: 'Approved' },
    { key: 'commission', label: 'Commission' },
    { key: 'wallet', label: 'Wallet Payout' }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justify: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '920px',
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
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
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
              background: '#10B981',
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {(overview.customer_name || 'L')[0]}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Enterprise Lead Orchestration • ID #{leadId ? leadId.substring(0, 8) : ''}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{overview.customer_name || 'Loading...'}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Status Selector */}
            <select
              value={status}
              onChange={(e) => handleStageTransition(e.target.value, e.target.value === 'approved' ? 'approved' : e.target.value === 'rejected' ? 'rejected' : 'bank')}
              disabled={updatingStatus}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="pending" style={{ color: '#000' }}>🟡 Pending Review</option>
              <option value="submitted" style={{ color: '#000' }}>🟣 Submitted to Bank</option>
              <option value="under_review" style={{ color: '#000' }}>🟣 Bank Processing</option>
              <option value="approved" style={{ color: '#000' }}>🟢 Approved & Credit Payout</option>
              <option value="rejected" style={{ color: '#000' }}>🔴 Rejected</option>
            </select>

            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MdClose style={{ fontSize: '20px' }} />
            </button>
          </div>
        </div>

        {/* Pipeline Stepper Bar */}
        <div style={{ background: C.bgSecondary, padding: '14px 24px', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '600px' }}>
            {pipelineStages.map((stage, idx) => {
              const active = pipelineStage === stage.key;
              const completed = pipelineStages.findIndex(s => s.key === pipelineStage) > idx || status === 'approved';
              return (
                <React.Fragment key={stage.key}>
                  <div
                    onClick={() => handleStageTransition(status, stage.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: completed ? '#ECFDF5' : active ? C.teal : C.card,
                      color: completed ? '#059669' : active ? '#FFF' : C.textLight,
                      border: `1px solid ${completed ? '#10B981' : active ? C.teal : C.border}`
                    }}
                  >
                    {completed ? <MdCheckCircle style={{ fontSize: '14px' }} /> : <span>{idx + 1}.</span>}
                    <span>{stage.label}</span>
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <div style={{ width: '16px', height: '2px', background: completed ? '#10B981' : C.border }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 9 Tabs Bar */}
        <div style={{ display: 'flex', overflowX: 'auto', background: C.card, borderBottom: `1px solid ${C.border}`, padding: '4px 12px' }}>
          {[
            { id: 'overview', label: 'Lead Overview', icon: MdPerson },
            { id: 'checklist', label: `Verification (${checklist.filter(c => c.status === 'verified').length}/${checklist.length})`, icon: MdVerifiedUser },
            { id: 'documents', label: `Documents (${documents.length})`, icon: MdDescription },
            { id: 'timeline', label: `Timeline (${timeline.length})`, icon: MdTimeline },
            { id: 'history', label: `Status History (${status_history.length})`, icon: MdHistory },
            { id: 'bank_assign', label: 'Bank Executive', icon: MdAccountBalance },
            { id: 'notes', label: `Notes (${notes.filter(n => n.visibility !== 'private').length})`, icon: MdNote },
            { id: 'internal_notes', label: `Internal Notes (${notes.filter(n => n.visibility === 'private').length})`, icon: MdLock },
            { id: 'commission', label: 'Wallet & Payout', icon: MdAccountBalanceWallet },
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
                  background: active ? C.bgSecondary : 'transparent',
                  color: active ? (tab.id === 'internal_notes' ? C.red : C.text) : C.textLight
                }}
              >
                <Icon style={{ fontSize: '16px', color: active ? (tab.id === 'internal_notes' ? C.red : C.teal) : C.textLight }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>Loading 360° Lead Orchestration Data...</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div style={{ ...S.card, padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Customer & Contact</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div>Name: <strong>{overview.customer_name}</strong></div>
                      <div>Mobile: <strong>{overview.mobile}</strong></div>
                      <div>City: <strong>{overview.city || 'N/A'}</strong></div>
                      <div>PAN Card: <strong>{overview.pan_number || 'N/A'}</strong></div>
                      <div>Employment: <strong>{overview.employment_type || 'Salaried'}</strong></div>
                    </div>
                  </div>

                  <div style={{ ...S.card, padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Product & Financials</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div>Bank Partner: <strong>{overview.bank_name}</strong></div>
                      <div>Product: <strong>{overview.product_name}</strong></div>
                      <div>Category: <strong>{overview.product_category?.replace('_', ' ').toUpperCase()}</strong></div>
                      <div>Source: <strong>{overview.source?.toUpperCase()}</strong></div>
                      <div>Priority: <strong style={{ color: overview.priority === 'high' ? C.red : C.green }}>{overview.priority?.toUpperCase()}</strong></div>
                      <div>Partner Code: <strong>{overview.partner_code} ({overview.partner_first_name} {overview.partner_last_name || ''})</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VERIFICATION CHECKLIST */}
              {activeTab === 'checklist' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Automated Verification Checklist Engine</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {checklist.map(item => (
                      <div key={item.id} style={{ ...S.card, padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{item.item}</div>
                          <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
                            {item.verified_at ? `Verified by ${item.verifier_name || 'Staff'} on ${new Date(item.verified_at).toLocaleDateString()}` : 'Pending Verification'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleChecklist(item.item, item.status)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            background: item.status === 'verified' ? '#ECFDF5' : '#FEE2E2',
                            color: item.status === 'verified' ? '#059669' : '#DC2626'
                          }}
                        >
                          {item.status === 'verified' ? '✔ VERIFIED' : '✖ MARK VERIFIED'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {documents.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No lead documents uploaded yet.</div>
                    ) : (
                      documents.map(d => (
                        <div key={d.id} style={{ ...S.card, padding: '14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, textTransform: 'uppercase' }}>{d.document_type.replace('_', ' ')}</div>
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              {d.verification_status.toUpperCase()}
                            </span>
                            <div style={{ marginTop: '8px' }}>
                              <a href={d.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: C.teal, fontWeight: 700 }}>Preview File</a>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: TIMELINE */}
              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {timeline.map((t, idx) => (
                    <div key={t.id || idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: C.teal, marginTop: '4px', flexShrink: 0 }} />
                      <div style={{ ...S.card, padding: '12px 16px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: C.text }}>
                          <span>{t.title}</span>
                          <span style={{ fontSize: '11px', color: C.textLight }}>{new Date(t.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: C.textMid, marginTop: '4px' }}>{t.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: BANK EXECUTIVE ASSIGNMENT */}
              {activeTab === 'bank_assign' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ ...S.card, padding: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 12px 0' }}>Assigned Bank Executive</h4>
                    {bank_assignment ? (
                      <div style={{ fontSize: '13px', color: C.text, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>Executive Name: <strong>{bank_assignment.executive_name}</strong></div>
                        <div>Mobile: <strong>{bank_assignment.mobile || 'N/A'}</strong></div>
                        <div>Email: <strong>{bank_assignment.email || 'N/A'}</strong></div>
                        <div>Assigned Date: <strong>{new Date(bank_assignment.assigned_at).toLocaleDateString()}</strong></div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: C.textLight }}>No bank executive assigned to this lead yet.</div>
                    )}
                  </div>

                  <form onSubmit={handleAssignBankExec} style={{ ...S.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Assign / Reassign Bank Executive</h4>
                    <input style={S.input} placeholder="Executive Name *" value={execName} onChange={(e) => setExecName(e.target.value)} />
                    <input style={S.input} placeholder="Mobile Number" value={execMobile} onChange={(e) => setExecMobile(e.target.value)} />
                    <input style={S.input} placeholder="Email Address" value={execEmail} onChange={(e) => setExecEmail(e.target.value)} />
                    <button type="submit" disabled={assigningBank} style={{ ...S.btn('primary') }}>Assign Bank Executive</button>
                  </form>
                </div>
              )}

              {/* TAB 6: INTERNAL NOTES (ADMIN ONLY) */}
              {activeTab === 'internal_notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: '10px', color: '#DC2626', fontSize: '13px', fontWeight: 700 }}>
                    🔒 INTERNAL NOTES WARNING: Notes logged here are strictly hidden from partner dashboards.
                  </div>

                  <form onSubmit={(e) => handleAddNote(e, true)} style={{ display: 'flex', gap: '10px' }}>
                    <input style={{ ...S.input, flex: 1 }} placeholder="Record internal note (e.g. Low CIBIL score, verification query)..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                    <button type="submit" disabled={addingNote} style={{ ...S.btn('primary'), background: C.red }}>Save Private Note</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notes.filter(n => n.visibility === 'private').map(n => (
                      <div key={n.id} style={{ ...S.card, padding: '12px 16px', borderLeft: `4px solid ${C.red}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: C.textLight }}>
                          <span>By {n.author_name || 'Admin'}</span>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '13.5px', color: C.text, marginTop: '6px' }}>{n.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: COMMISSION & WALLET */}
              {activeTab === 'commission' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ ...S.card, padding: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Automatic Commission & Wallet Ledger</h3>
                    {commission_ledger ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                        <div>Calculated Commission: <strong style={{ color: C.green, fontSize: '18px' }}>₹{parseFloat(commission_ledger.commission_earned || 0).toLocaleString()}</strong></div>
                        <div>Commission Rate: <strong>{commission_ledger.commission_rate}%</strong></div>
                        <div>Status: <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>{commission_ledger.status?.toUpperCase()}</span></div>
                        <div>Auto-Release Date: <strong>{new Date(commission_ledger.hold_until).toLocaleDateString()}</strong></div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: C.textLight }}>Commission ledger entry will generate automatically upon bank approval.</div>
                    )}
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}
