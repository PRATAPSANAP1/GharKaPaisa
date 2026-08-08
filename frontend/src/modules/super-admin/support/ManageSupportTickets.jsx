import React, { useState, useEffect, useRef } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import {
  MdSupportAgent, MdSearch, MdSend, MdCheckCircle,
  MdOutlineForum, MdRefresh, MdPerson
} from 'react-icons/md';

const POLL_INTERVAL = 10000;

const statusColor = (status, C) => {
  switch (status) {
    case 'open': return C.gold;
    case 'in_progress': return C.primary;
    case 'resolved':
    case 'closed': return C.green;
    default: return C.textLight;
  }
};

export default function ManageSupportTickets() {
  const { C } = useTheme();
  const S = makeS(C);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [width, setWidth] = useState(window.innerWidth);
  const chatRef = useRef(null);
  const pollRef = useRef(null);

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/support/tickets');
      if (res.data?.success) {
        const data = res.data.data;
        setTickets(data);
        setSelected(prev => prev ? (data.find(t => t.id === prev.id) || prev) : prev);
      }
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    pollRef.current = setInterval(() => fetchTickets(true), POLL_INTERVAL);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [selected?.replies?.length, selected?.id]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    try {
      const res = await api.post(`/support/tickets/${selected.id}/reply`, { message: reply.trim() });
      if (res.data?.success) {
        setReply('');
        setSelected(res.data.data);
        fetchTickets(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleSetStatus = async (status) => {
    if (!selected) return;
    try {
      const res = await api.patch(`/support/tickets/${selected.id}/status`, { status });
      if (res.data?.success) {
        setSelected(res.data.data);
        fetchTickets(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const isMobile = width < 992;

  const filtered = tickets.filter(t => {
    const id = `TKT-${t.id.substring(0, 8)}`.toLowerCase();
    const name = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase();
    const code = (t.partner_code || '').toLowerCase();
    const matchSearch =
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      id.includes(search.toLowerCase()) ||
      name.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      t.status === statusFilter ||
      (statusFilter === 'resolved' && t.status === 'closed');
    return matchSearch && matchStatus;
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      height: isMobile ? 'auto' : 'calc(100vh - 160px)',
      paddingBottom: '40px',
    }}>

      {/* ── LEFT: TICKET LIST ── */}
      <div style={{
        width: isMobile ? '100%' : '340px',
        background: C.card,
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? '380px' : '100%',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdSupportAgent style={{ color: C.teal }} /> Support Tickets
            </h2>
            <button
              onClick={() => fetchTickets()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, display: 'flex', alignItems: 'center' }}
              title="Refresh"
            >
              <MdRefresh size={20} />
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} size={16} />
            <input
              type="text"
              placeholder="Search name, code, subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...S.input, paddingLeft: '32px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '2px', background: C.bgSecondary, padding: '3px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
            {['all', 'open', 'in_progress', 'resolved'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  flex: 1, padding: '5px 0', fontSize: '10px', fontWeight: 700,
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  background: statusFilter === tab ? C.card : 'transparent',
                  color: statusFilter === tab ? C.teal : C.textMid,
                  boxShadow: statusFilter === tab ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                  textTransform: 'uppercase',
                }}
              >
                {tab === 'in_progress' ? 'ACTIVE' : tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.textLight, fontSize: '13px' }}>Loading tickets...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.textLight }}>
              <MdOutlineForum size={32} style={{ color: C.border, marginBottom: '8px' }} />
              <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>No tickets found.</p>
            </div>
          ) : filtered.map(tkt => {
            const isSelected = selected?.id === tkt.id;
            const tktId = `TKT-${tkt.id.substring(0, 8).toUpperCase()}`;
            const partnerName = `${tkt.first_name || ''} ${tkt.last_name || ''}`.trim() || 'Unknown Partner';
            return (
              <div
                key={tkt.id}
                onClick={() => setSelected(tkt)}
                style={{
                  padding: '12px', borderRadius: '12px', cursor: 'pointer',
                  border: `1px solid ${isSelected ? C.teal : C.border}`,
                  background: isSelected ? `${C.teal}12` : C.card,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: C.textLight }}>{tktId}</span>
                  <span style={S.tag(statusColor(tkt.status, C))}>{tkt.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <MdPerson size={12} style={{ color: C.teal, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: C.teal }}>{partnerName}</span>
                  {tkt.partner_code && (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: C.textLight, fontFamily: 'monospace' }}>
                      · {tkt.partner_code}
                    </span>
                  )}
                </div>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: C.text, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {tkt.subject}
                </h4>
                <p style={{ fontSize: '10px', color: C.textLight, margin: '5px 0 0', fontWeight: 500 }}>
                  {new Date(tkt.created_at).toLocaleDateString('en-IN')} · {tkt.category}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: TICKET DETAIL / CHAT ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        background: C.card,
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? '500px' : '100%',
        overflow: 'hidden',
      }}>
        {selected ? (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
              background: C.bgSecondary, display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', flexShrink: 0, gap: '12px',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: 0 }}>{selected.subject}</h2>
                  <span style={S.tag(statusColor(selected.status, C))}>{selected.status}</span>
                </div>
                <p style={{ fontSize: '11px', color: C.textLight, margin: 0, fontFamily: 'monospace' }}>
                  {`TKT-${selected.id.substring(0, 8).toUpperCase()}`}
                  {' · '}
                  <span style={{ color: C.teal, fontWeight: 700 }}>
                    {`${selected.first_name || ''} ${selected.last_name || ''}`.trim()}
                    {selected.partner_code ? ` (${selected.partner_code})` : ''}
                  </span>
                  {selected.partner_email ? ` · ${selected.partner_email}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {selected.status !== 'resolved' && selected.status !== 'closed' && (
                  <button
                    onClick={() => handleSetStatus('resolved')}
                    title="Mark Resolved"
                    style={{
                      background: C.card, border: `1px solid ${C.border}`, color: C.green,
                      width: 32, height: 32, borderRadius: '8px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    <MdCheckCircle size={18} />
                  </button>
                )}
                {(selected.status === 'resolved' || selected.status === 'closed') && (
                  <button
                    onClick={() => handleSetStatus('open')}
                    title="Reopen Ticket"
                    style={{
                      background: C.card, border: `1px solid ${C.border}`, color: C.gold,
                      padding: '4px 10px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 700,
                    }}
                  >
                    REOPEN
                  </button>
                )}
              </div>
            </div>

            {/* Chat Thread */}
            <div
              ref={chatRef}
              style={{
                flex: 1, overflowY: 'auto', padding: '18px',
                background: C.bgSecondary, display: 'flex', flexDirection: 'column', gap: '16px',
              }}
            >
              {/* Original description bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  {`${selected.first_name || 'Partner'} ${selected.last_name || ''}`.trim()}
                </span>
                <div style={{
                  padding: '10px 14px', borderRadius: '14px', maxWidth: '80%',
                  fontSize: '13px', lineHeight: 1.5,
                  background: C.card, color: C.text,
                  border: `1px solid ${C.border}`,
                  borderTopLeftRadius: '2px',
                }}>
                  {selected.description}
                </div>
              </div>

              {/* Replies */}
              {(selected.replies || []).map((msg, idx) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                      {isAdmin ? 'Support Team' : `${selected.first_name || 'Partner'} ${selected.last_name || ''}`.trim()}
                    </span>
                    <div style={{
                      padding: '10px 14px', borderRadius: '14px', maxWidth: '80%',
                      fontSize: '13px', lineHeight: 1.5,
                      background: isAdmin ? `linear-gradient(135deg, ${C.teal}, ${C.tealDim})` : C.card,
                      color: isAdmin ? '#fff' : C.text,
                      border: isAdmin ? 'none' : `1px solid ${C.border}`,
                      borderTopRightRadius: isAdmin ? '2px' : '14px',
                      borderTopLeftRadius: isAdmin ? '14px' : '2px',
                    }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: '10px', color: C.textLight, marginTop: '3px' }}>
                      {new Date(msg.sent_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reply Box */}
            {selected.status !== 'closed' && selected.status !== 'resolved' ? (
              <div style={{ padding: '14px', borderTop: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
                <form onSubmit={handleSendReply} style={{ position: 'relative' }}>
                  <textarea
                    rows="2"
                    placeholder="Type your reply as Support Team..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    style={{ ...S.input, paddingRight: '50px', resize: 'none', borderRadius: '12px' }}
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim()}
                    style={{
                      position: 'absolute', right: '10px', bottom: '10px',
                      width: 34, height: 34, borderRadius: '8px', border: 'none',
                      background: C.teal, color: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      opacity: reply.trim() ? 1 : 0.4,
                    }}
                  >
                    <MdSend size={16} />
                  </button>
                </form>
              </div>
            ) : (
              <div style={{
                padding: '14px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary,
                textAlign: 'center', fontSize: '12px', fontWeight: 700, color: C.textLight, flexShrink: 0,
              }}>
                This ticket is resolved and closed to new replies.
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '24px' }}>
            <MdSupportAgent size={48} style={{ color: C.border, marginBottom: '12px' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Select a Ticket</h2>
            <p style={{ fontSize: '13px', color: C.textMid, maxWidth: '300px', margin: 0 }}>
              Click any ticket from the list to view the full conversation and reply as Support Team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
