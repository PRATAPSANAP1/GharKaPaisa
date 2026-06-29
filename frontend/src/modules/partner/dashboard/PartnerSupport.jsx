import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSupportAgent, MdAdd, MdSearch, 
  MdCheckCircle, MdPendingActions, MdClose, MdSend,
  MdOutlineForum
} from 'react-icons/md';

const MOCK_TICKETS = [
  { id: 'TKT-1029', subject: 'Commission not credited for Lead #APP-592', status: 'open', priority: 'high', date: '2026-06-22', messages: [{ sender: 'partner', text: 'Hi, the lead was disbursed 3 days ago but wallet is not updated.' }, { sender: 'support', text: 'We are checking with the accounts team. Please allow 24 hours.' }] },
  { id: 'TKT-1015', subject: 'Unable to download ID Card', status: 'closed', priority: 'low', date: '2026-06-15', messages: [{ sender: 'partner', text: 'Where can I find my ID card?' }, { sender: 'support', text: 'It is available in the Document Vault section now.' }] },
  { id: 'TKT-0988', subject: 'Change bank account details', status: 'resolved', priority: 'medium', date: '2026-06-02', messages: [{ sender: 'partner', text: 'I want to change my payout bank to ICICI.' }, { sender: 'support', text: 'Bank details updated successfully as requested.' }] },
];

export default function PartnerSupport() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 992;

  const filteredTickets = MOCK_TICKETS.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'all' || t.status === activeTab || (activeTab === 'resolved' && t.status === 'closed');
    return matchSearch && matchTab;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return C.gold;
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
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdSupportAgent style={{ color: C.primary }} /> Helpdesk
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
          {filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.textLight }}>
              <MdOutlineForum size={36} style={{ color: C.border, marginBottom: '8px' }} />
              <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>No tickets found.</p>
            </div>
          ) : (
            filteredTickets.map(tkt => {
              const isSelected = selectedTicket?.id === tkt.id;
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
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: C.textLight }}>{tkt.id}</span>
                    <span style={S.tag(getStatusColor(tkt.status))}>{tkt.status}</span>
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {tkt.subject}
                  </h4>
                  <p style={{ fontSize: '11px', color: C.textLight, margin: '8px 0 0', fontWeight: 500 }}>{tkt.date}</p>
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
                  {selectedTicket.id} • Created on {selectedTicket.date}
                </p>
              </div>
              <button style={{
                background: C.card, border: `1px solid ${C.border}`, color: C.green,
                width: 36, height: 36, borderRadius: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>
                <MdCheckCircle size={20} title="Mark as Resolved" />
              </button>
            </div>

            {/* Chat Thread */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px',
              background: C.bgSecondary, display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              {selectedTicket.messages.map((msg, idx) => {
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
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Box */}
            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' ? (
              <div style={{ padding: '16px', borderTop: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    rows="2"
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ ...S.input, paddingRight: '52px', resize: 'none', borderRadius: '12px' }}
                  />
                  <button 
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
                </div>
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
          <div style={{
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
                <select style={{
                  ...S.input, appearance: 'auto', backgroundImage: 'none'
                }}>
                  <option>Commission & Payouts</option>
                  <option>Lead Status & Tracking</option>
                  <option>KYC & Profile Update</option>
                  <option>Technical Issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Subject *</label>
                <input type="text" placeholder="Brief summary of the issue" style={S.input} />
              </div>

              <div>
                <label style={S.label}>Description *</label>
                <textarea rows="3" placeholder="Provide details about your issue..." style={{ ...S.input, resize: 'none' }} />
              </div>
            </div>

            <div style={{
              padding: '16px 20px', borderTop: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', gap: '10px'
            }}>
              <button 
                onClick={() => setIsNewTicketModalOpen(false)}
                style={{
                  ...S.btn('outline'), flex: 1, padding: '10px', fontSize: '14px', borderRadius: '10px'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsNewTicketModalOpen(false)}
                style={{
                  ...S.btn('primary'), flex: 2, padding: '10px', fontSize: '14px', border: 'none', borderRadius: '10px'
                }}
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
