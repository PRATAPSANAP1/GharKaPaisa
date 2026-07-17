import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { 
  MdSupportAgent, MdAdd, MdSearch, 
  MdCheckCircle, MdPendingActions, MdClose, MdSend,
  MdOutlineForum
} from 'react-icons/md';

export default function PartnerSupport() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [width, setWidth] = useState(window.innerWidth);

  // New ticket state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Commission & Payouts');
  const [priority, setPriority] = useState('medium');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support/tickets');
      if (res.data?.success) {
        setTickets(res.data.data);
        if (selectedTicket) {
          const updated = res.data.data.find(t => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    try {
      const res = await api.post('/support/tickets', {
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority
      });
      if (res.data?.success) {
        alert('Support ticket created successfully!');
        setIsNewTicketModalOpen(false);
        setSubject('');
        setDescription('');
        fetchTickets();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create support ticket');
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/reply`, {
        message: replyText.trim()
      });
      if (res.data?.success) {
        setReplyText('');
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedTicket || !window.confirm('Mark this ticket as resolved?')) return;
    try {
      const res = await api.patch(`/support/tickets/${selectedTicket.id}/status`, {
        status: 'resolved'
      });
      if (res.data?.success) {
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark ticket as resolved');
    }
  };

  const isMobile = width < 992;

  const filteredTickets = tickets.filter(t => {
    const ticketIdStr = `TKT-${t.id.substring(0, 8)}`.toLowerCase();
    const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || ticketIdStr.includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'all' || t.status === activeTab || (activeTab === 'resolved' && t.status === 'closed');
    return matchSearch && matchTab;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return C.gold;
      case 'in_progress': return C.primary;
      case 'resolved':
      case 'closed': return C.green;
      default: return C.textLight;
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    height: isMobile ? 'auto' : 'calc(100vh - 160px)',
    paddingBottom: '40px'
  };

  const listPaneStyle = {
    width: isMobile ? '100%' : '340px',
    background: C.card,
    borderRadius: '16px',
    border: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    height: isMobile ? '380px' : '100%',
    overflow: 'hidden',
    flexShrink: 0
  };

  const chatPaneStyle = {
    flex: 1,
    minWidth: 0,
    background: C.card,
    borderRadius: '16px',
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: isMobile ? '500px' : '100%',
    position: 'relative'
  };

  return (
    <div style={containerStyle}>
      
      {/* ═══ LEFT COLUMN: TICKET LIST ═══ */}
      <div style={listPaneStyle}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 id="partner-support-title" style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdSupportAgent style={{ color: C.primary }} /> {t("support.title", "Helpdesk")}
            </h2>
            <button 
              onClick={() => setIsNewTicketModalOpen(true)}
              style={{
                background: C.primary, border: 'none', color: '#fff',
                width: 36, height: 36, borderRadius: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: `0 4px 12px ${C.primary}30`
              }}
              title="Create New Ticket"
            >
              <MdAdd size={20} />
            </button>
          </div>
          
          <div style={{ position: 'relative' }}>
            <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={18} />
            <input 
              type="text" 
              placeholder="Search ticket ID or subject..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...S.input, paddingLeft: '36px', paddingTop: '10px', paddingBottom: '10px' }}
            />
          </div>

          <div style={{
            display: 'flex', gap: '2px', background: C.bgSecondary,
            padding: '3px', borderRadius: '10px', border: `1px solid ${C.border}`
          }}>
            {['all', 'open', 'resolved'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '6px 0', fontSize: '11px', fontWeight: 700,
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  background: activeTab === tab ? C.card : 'transparent',
                  color: activeTab === tab ? C.primary : C.textMid,
                  boxShadow: activeTab === tab ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.textLight }}>
              Loading tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.textLight }}>
              <MdOutlineForum size={36} style={{ color: C.border, marginBottom: '8px' }} />
              <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>No tickets found.</p>
            </div>
          ) : (
            filteredTickets.map(tkt => {
              const isSelected = selectedTicket?.id === tkt.id;
              const formattedId = `TKT-${tkt.id.substring(0, 8).toUpperCase()}`;
              return (
                <div 
                  key={tkt.id}
                  onClick={() => setSelectedTicket(tkt)}
                  style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer',
                    border: `1px solid ${isSelected ? C.primary : C.border}`,
                    background: isSelected ? `${C.primary}12` : C.card,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: C.textLight }}>{formattedId}</span>
                    <span style={S.tag(getStatusColor(tkt.status))}>{tkt.status}</span>
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {tkt.subject}
                  </h4>
                  <p style={{ fontSize: '11px', color: C.textLight, margin: '8px 0 0', fontWeight: 500 }}>
                    {new Date(tkt.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ RIGHT COLUMN: TICKET DETAIL VIEW ═══ */}
      <div style={chatPaneStyle}>
        {selectedTicket ? (
          <>
            {/* Detail Header */}
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>{selectedTicket.subject}</h2>
                  <span style={S.tag(getStatusColor(selectedTicket.status))}>{selectedTicket.status}</span>
                </div>
                <p style={{ fontSize: '12px', fontFamily: 'monospace', color: C.textLight, margin: '4px 0 0' }}>
                  {`TKT-${selectedTicket.id.substring(0, 8).toUpperCase()}`} • Created on {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                <button 
                  onClick={handleMarkResolved}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`, color: C.green,
                    width: 36, height: 36, borderRadius: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  <MdCheckCircle size={20} title="Mark as Resolved" />
                </button>
              )}
            </div>

            {/* Chat Thread */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px',
              background: C.bgSecondary, display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              {/* Original ticket request message */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  You
                </span>
                <div style={{
                  padding: '12px 16px', borderRadius: '16px', maxWidth: '80%',
                  fontSize: '13px', lineHeight: 1.5,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                  color: '#fff',
                  borderTopRightRadius: '2px',
                  borderTopLeftRadius: '16px',
                }}>
                  {selectedTicket.description}
                </div>
              </div>

              {/* Replies */}
              {(selectedTicket.replies || []).map((msg, idx) => {
                const isPartner = msg.sender === 'partner';
                return (
                  <div key={idx} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isPartner ? 'flex-end' : 'flex-start'
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                      {isPartner ? 'You' : 'Support Team'}
                    </span>
                    <div style={{
                      padding: '12px 16px', borderRadius: '16px', maxWidth: '80%',
                      fontSize: '13px', lineHeight: 1.5,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      background: isPartner ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.card,
                      color: isPartner ? '#fff' : C.text,
                      border: isPartner ? 'none' : `1px solid ${C.border}`,
                      borderTopRightRadius: isPartner ? '2px' : '16px',
                      borderTopLeftRadius: isPartner ? '16px' : '2px',
                    }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Box */}
            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' ? (
              <div style={{ padding: '16px', borderTop: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
                <form onSubmit={handleSendReply} style={{ position: 'relative' }}>
                  <textarea 
                    rows="2"
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ ...S.input, paddingRight: '52px', resize: 'none', borderRadius: '12px' }}
                  />
                  <button 
                    type="submit"
                    disabled={!replyText.trim()}
                    style={{
                      position: 'absolute', right: '10px', bottom: '10px',
                      width: 36, height: 36, borderRadius: '8px', border: 'none',
                      background: C.primary, color: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      opacity: replyText.trim() ? 1 : 0.5
                    }}
                  >
                    <MdSend size={18} />
                  </button>
                </form>
              </div>
            ) : (
              <div style={{
                padding: '16px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary,
                textAlign: 'center', fontSize: '13px', fontWeight: 700, color: C.textLight, flexShrink: 0
              }}>
                This ticket has been resolved and is closed to new replies.
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', minHeight: '300px', textAlign: 'center', padding: '24px'
          }}>
            <div style={{
              width: 72, height: 72, bg: C.bgSecondary, border: `1px solid ${C.border}`,
              color: C.textLight, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '16px', background: C.bgSecondary
            }}>
              <MdSupportAgent size={36} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>How can we help?</h2>
            <p style={{ fontSize: '14px', color: C.textMid, maxWidth: '340px', margin: 0 }}>
              Select a ticket from the left to view the conversation, or create a new ticket to get assistance from our team.
            </p>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <form onSubmit={handleCreateTicket} style={{
            background: C.card, borderRadius: '20px', width: '100%', maxWidth: '440px',
            overflow: 'hidden', border: `1px solid ${C.border}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Create New Ticket</h3>
              <button 
                type="button"
                onClick={() => setIsNewTicketModalOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <MdClose size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={S.label}>Category *</label>
                <select 
                  id="partner-support-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ ...S.input, appearance: 'auto', backgroundImage: 'none' }}
                >
                  <option value="Commission & Payouts">{t("support.commissionPayouts", "Commission & Payouts")}</option>
                  <option value="Lead Status & Tracking">{t("support.leadStatusTracking", "Lead Status & Tracking")}</option>
                  <option value="KYC & Profile Update">{t("support.kycProfileUpdate", "KYC & Profile Update")}</option>
                  <option value="Technical Issue">{t("support.technicalIssue", "Technical Issue")}</option>
                  <option value="Other">{t("support.other", "Other")}</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Subject *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Brief summary of the issue" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={S.input} 
                />
              </div>

              <div>
                <label style={S.label}>Description *</label>
                <textarea 
                  rows="3" 
                  required
                  placeholder="Provide details about your issue..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...S.input, resize: 'none' }} 
                />
              </div>
            </div>

            <div style={{
              padding: '16px 20px', borderTop: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', gap: '10px'
            }}>
              <button 
                type="button"
                onClick={() => setIsNewTicketModalOpen(false)}
                style={{
                  ...S.btn('outline'), flex: 1, padding: '10px', fontSize: '14px', borderRadius: '10px'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{
                  ...S.btn('primary'), flex: 2, padding: '10px', fontSize: '14px', border: 'none', borderRadius: '10px'
                }}
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
