import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { useTheme, makeS } from '../../../../contexts/ThemeContext';
import { 
  MdClose, MdPerson, MdCreditCard, MdDescription, MdTimeline, 
  MdNote, MdAlarm, MdChat, MdHistory, MdAccountBalanceWallet,
  MdCheckCircle, MdPhone, MdEmail, MdLocationOn, MdWork, MdBadge,
  MdAttachMoney, MdPictureAsPdf, MdDownload, MdCloudUpload, MdSend,
  MdCall, MdOutlineWhatsapp, MdPushPin, MdAdd
} from 'react-icons/md';

export default function Customer360ProfileModal({ customerId, onClose, onRefresh }) {
  const { C } = useTheme();
  const S = makeS(C);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, applications, documents, timeline, notes, followups, communication, activities, commission

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

  useEffect(() => {
    fetchProfileData();
  }, [customerId]);

  if (!customerId) return null;

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

  const { overview = {}, applications = [], documents = [], timeline = [], notes = [], followups = [], communications = [], activity_logs = [] } = profile || {};

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
              <div style={{ fontSize: '12px', color: '#A5B4FC', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>360° Customer Profile</div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{overview.full_name || 'Loading...'}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Status Dropdown */}
            <select
              value={pipelineStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
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
              <option value="new" style={{ color: '#000' }}>⚪ New Lead</option>
              <option value="interested" style={{ color: '#000' }}>🔵 Interested</option>
              <option value="documents_pending" style={{ color: '#000' }}>🟡 Docs Pending</option>
              <option value="lead_created" style={{ color: '#000' }}>🟣 Lead Created</option>
              <option value="application_submitted" style={{ color: '#000' }}>🟣 Application Submitted</option>
              <option value="bank_verification" style={{ color: '#000' }}>🟣 Bank Verification</option>
              <option value="approved" style={{ color: '#000' }}>🟢 Approved</option>
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

        {/* 9 Profile Tabs Navigation Header */}
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
            { id: 'documents', label: `Documents (${documents.length})`, icon: MdDescription },
            { id: 'timeline', label: `Timeline (${timeline.length})`, icon: MdTimeline },
            { id: 'notes', label: `Notes (${notes.length})`, icon: MdNote },
            { id: 'followups', label: `Follow-ups (${followups.length})`, icon: MdAlarm },
            { id: 'communication', label: `Communication (${communications.length})`, icon: MdChat },
            { id: 'activities', label: 'Activities', icon: MdHistory },
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div style={{ ...S.card, padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Personal Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div>Full Name: <strong>{overview.full_name}</strong></div>
                      <div>Mobile: <strong>{overview.mobile}</strong></div>
                      <div>Email: <strong>{overview.email || 'N/A'}</strong></div>
                      <div>Date of Birth: <strong>{overview.dob ? new Date(overview.dob).toLocaleDateString() : 'N/A'}</strong></div>
                      <div>Occupation: <strong>{overview.occupation || 'N/A'}</strong></div>
                      <div>Monthly Income: <strong>{overview.monthly_income ? `₹${parseFloat(overview.monthly_income).toLocaleString('en-IN')}` : 'N/A'}</strong></div>
                      <div>Employer: <strong>{overview.employer || 'N/A'}</strong></div>
                    </div>
                  </div>

                  <div style={{ ...S.card, padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>KYC & Verification</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div>PAN Card: <strong>{overview.pan_number || 'N/A'}</strong></div>
                      <div>Aadhaar (Last 4): <strong>{overview.aadhaar_last4 ? `•••• ${overview.aadhaar_last4}` : 'N/A'}</strong></div>
                      <div>City: <strong>{overview.city || 'N/A'}</strong></div>
                      <div>State: <strong>{overview.state || 'N/A'}</strong></div>
                      <div>Pincode: <strong>{overview.pincode || 'N/A'}</strong></div>
                      <div>Pipeline Status: <strong style={{ color: C.teal }}>{(overview.pipeline_status || 'new').replace('_', ' ').toUpperCase()}</strong></div>
                      <div>Assigned Partner: <strong>{overview.partner_first_name ? `${overview.partner_first_name} ${overview.partner_last_name || ''}` : 'Direct'}</strong></div>
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
                          <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {['pan', 'aadhaar', 'salary_slip', 'itr', 'bank_statement', 'photo'].map(type => {
                      const doc = documents.find(d => d.document_type === type);
                      return (
                        <div key={type} style={{ ...S.card, padding: '14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, textTransform: 'uppercase' }}>{type.replace('_', ' ')}</div>
                          {doc ? (
                            <div style={{ marginTop: '8px' }}>
                              <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>VERIFIED</span>
                              <div style={{ marginTop: '8px' }}>
                                <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: C.teal, fontWeight: 700 }}>Preview Doc</a>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: C.textLight, marginTop: '8px' }}>Not Uploaded</div>
                          )}
                        </div>
                      );
                    })}
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
                  {activity_logs.map(log => (
                    <div key={log.id} style={{ ...S.card, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span><strong>{log.activity_type}</strong> by {log.performer_name || 'System'}</span>
                      <span style={{ color: C.textLight }}>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}
