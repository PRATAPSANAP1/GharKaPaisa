import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSearch, FaPaperclip, FaPaperPlane, FaSmile, FaUsers, 
  FaUser, FaFilePdf, FaFileAlt, FaCheckDouble, FaThumbtack, FaPlus, 
  FaTimes, FaPhone, FaVideo, FaEllipsisV, FaCircle, FaRedo,
  FaFilter, FaArrowLeft, FaDownload
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuthStore } from '../../app/store/authStore';

export default function MessengerView({ initialAppId = null }) {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState([]);

  // File Upload
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);

  // Responsive state
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWinW(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = winW < 768;

  // 1. Fetch Conversations
  const fetchConversations = async (showLoader = false) => {
    if (showLoader) setLoadingConvs(true);
    try {
      const res = await api.get('/messenger/conversations', {
        params: { filter, search }
      });
      if (res.data?.success) {
        setConversations(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (showLoader) setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
  }, [filter, search]);

  useEffect(() => {
    if (initialAppId) {
      handleStartAppChat(initialAppId);
    }
  }, [initialAppId]);

  // Auto-poll conversations & active chat messages
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
      if (activeConv) {
        fetchMessages(activeConv.id, false);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConv, filter, search]);

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = async (convId, showLoader = true) => {
    if (showLoader) setLoadingMsgs(true);
    try {
      const res = await api.get(`/messenger/conversations/${convId}/messages`);
      if (res.data?.success) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (showLoader) setLoadingMsgs(false);
    }
  };

  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    setMobileShowChat(true);
    fetchMessages(conv.id, true);
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!activeConv) return;
    if (!inputText.trim() && attachments.length === 0) return;

    const payload = {
      conversation_id: activeConv.id,
      message_text: inputText.trim(),
      message_type: attachments.length > 0 ? 'FILE' : 'TEXT',
      attachments: attachments
    };

    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id,
      sender_name: user?.full_name || 'You',
      message_text: inputText.trim(),
      message_type: attachments.length > 0 ? 'FILE' : 'TEXT',
      attachments: attachments,
      created_at: new Date().toISOString(),
      reads: []
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setAttachments([]);
    setSending(true);

    try {
      const res = await api.post('/messenger/messages', payload);
      if (res.data?.success) {
        fetchMessages(activeConv.id, false);
        fetchConversations(false);
      }
    } catch (err) {
      console.error('Send message failed:', err);
    } finally {
      setSending(false);
    }
  };

  // 4. File Attachment Handler
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const newAtt = {
          file_name: file.name,
          file_type: file.type.includes('image') ? 'IMAGE' : file.name.endsWith('.pdf') ? 'PDF' : 'DOCUMENT',
          file_size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          file_url: uploadEvt.target.result
        };
        setAttachments(prev => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Contacts lookup
  const fetchContacts = async (queryText = '') => {
    try {
      const res = await api.get('/messenger/contacts', { params: { query: queryText } });
      if (res.data?.success) setContacts(res.data.data || []);
    } catch (err) {
      console.error('Failed to search contacts:', err);
    }
  };

  const handleStartDirectChat = async (targetUserId) => {
    try {
      const res = await api.post('/messenger/conversations/direct', { target_user_id: targetUserId });
      if (res.data?.success) {
        setShowNewChatModal(false);
        fetchConversations(false);
        handleSelectConv(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start chat.');
    }
  };

  const handleStartAppChat = async (appId) => {
    try {
      const res = await api.post('/messenger/conversations/application', { application_id: appId });
      if (res.data?.success) {
        fetchConversations(false);
        handleSelectConv(res.data.data);
      }
    } catch (err) {
      console.error('Failed to start app chat:', err);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return alert('Please enter group name');
    try {
      const res = await api.post('/messenger/conversations/group', {
        name: groupName.trim(),
        description: groupDesc.trim(),
        member_user_ids: selectedContactIds
      });
      if (res.data?.success) {
        setShowGroupModal(false);
        setGroupName('');
        setGroupDesc('');
        setSelectedContactIds([]);
        fetchConversations(false);
        handleSelectConv(res.data.data);
      }
    } catch (err) {
      alert('Failed to create group');
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getConvTitle = (conv) => {
    if (conv.name) return conv.name;
    if (conv.other_participants && conv.other_participants.length > 0) {
      return conv.other_participants.map(p => p.full_name).join(', ');
    }
    return 'Direct Chat';
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 90px)',
      background: '#F8FAFC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    }}>

      {/* ── LEFT PANE: CHAT LIST ── */}
      {(!isMobile || !mobileShowChat) && (
        <div style={{
          width: isMobile ? '100%' : '360px',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF'
        }}>
          {/* Top Search Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Messages</h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => { setShowNewChatModal(true); fetchContacts(''); }}
                  title="New Chat"
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF',
                    border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <FaPlus size={13} />
                </button>
                <button
                  onClick={() => { setShowGroupModal(true); fetchContacts(''); }}
                  title="New Group"
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9',
                    border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <FaUsers size={13} />
                </button>
              </div>
            </div>

            {/* Search Input Box */}
            <div style={{
              display: 'flex', alignItems: 'center', background: '#F8FAFC',
              borderRadius: '24px', padding: '8px 16px', border: '1px solid #E2E8F0'
            }}>
              <FaSearch color="#94A3B8" size={14} style={{ marginRight: '10px' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#0F172A', fontSize: '13.5px', width: '100%', fontWeight: 500
                }}
              />
              <FaFilter color="#94A3B8" size={13} style={{ cursor: 'pointer', marginLeft: '6px' }} />
            </div>

            {/* Sub Filter Chips */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', overflowX: 'auto' }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'DIRECT', label: 'Direct' },
                { id: 'GROUPS', label: 'Groups' },
                { id: 'APPLICATIONS', label: 'Applications' },
                { id: 'UNREAD', label: 'Unread' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '5px 12px', borderRadius: '16px', border: 'none',
                    background: filter === tab.id ? '#2563EB' : '#F1F5F9',
                    color: filter === tab.id ? '#FFFFFF' : '#64748B',
                    fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Cards List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConvs ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#475569' }}>No chats found</p>
                <span>Click + to start a new chat</span>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = activeConv?.id === conv.id;
                const title = getConvTitle(conv);
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConv(conv)}
                    style={{
                      padding: '14px 20px', borderBottom: '1px solid #F8FAFC',
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* User / Group Avatar */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '50%',
                        background: conv.conversation_type === 'GROUP' ? '#3B82F6' : conv.conversation_type === 'APPLICATION' ? '#F59E0B' : '#0EA5E9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#fff', fontSize: '17px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}>
                        {conv.conversation_type === 'GROUP' ? <FaUsers size={20} /> : conv.conversation_type === 'APPLICATION' ? <FaFileAlt size={18} /> : title.charAt(0).toUpperCase()}
                      </div>
                      <span style={{
                        position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px',
                        borderRadius: '50%', background: '#22C55E', border: '2px solid #FFFFFF'
                      }} />
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{
                          margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#0F172A',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px'
                        }}>
                          {title}
                        </h4>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                          {formatTime(conv.last_message_at || conv.created_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{
                          margin: 0, fontSize: '12.5px', color: '#64748B', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px'
                        }}>
                          {conv.last_message_text || 'No messages yet'}
                        </p>

                        {conv.unread_count > 0 && (
                          <span style={{
                            background: '#EF4444', color: '#FFFFFF', fontSize: '11px', fontWeight: 800,
                            width: '20px', height: '20px', borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(239,68,68,0.4)'
                          }}>
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── RIGHT PANE: DESKTOP CHAT WINDOW ── */}
      {(!isMobile || mobileShowChat) && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '14px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {isMobile && (
                    <button
                      onClick={() => setMobileShowChat(false)}
                      style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '16px', cursor: 'pointer', marginRight: '4px' }}
                    >
                      <FaArrowLeft />
                    </button>
                  )}

                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: activeConv.conversation_type === 'GROUP' ? '#3B82F6' : '#0EA5E9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#fff', fontSize: '17px'
                    }}>
                      {activeConv.conversation_type === 'GROUP' ? <FaUsers size={20} /> : getConvTitle(activeConv).charAt(0).toUpperCase()}
                    </div>
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px',
                      borderRadius: '50%', background: '#22C55E', border: '2px solid #FFFFFF'
                    }} />
                  </div>

                  <div>
                    <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: '#0F172A' }}>
                      {getConvTitle(activeConv)}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>
                      Online
                    </span>
                  </div>
                </div>

                {/* Top Action Icons (Search, Phone, Video, Menu) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748B' }}>
                  <FaSearch style={{ cursor: 'pointer' }} size={16} title="Search chat" />
                  <FaPhone style={{ cursor: 'pointer' }} size={15} title="Voice Call" />
                  <FaVideo style={{ cursor: 'pointer' }} size={16} title="Video Call" />
                  <FaEllipsisV style={{ cursor: 'pointer' }} size={15} title="More Options" />
                </div>
              </div>

              {/* Chat Messages Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '40px' }}>
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '60px' }}>
                    <p style={{ fontWeight: 700, color: '#334155', fontSize: '15px', margin: '0 0 4px' }}>Say hi to start the conversation!</p>
                    <span>Type your message in the input box below.</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          maxWidth: '65%', padding: '12px 18px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe ? '#DBEAFE' : '#FFFFFF',
                          border: isMe ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                          color: '#1E293B',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          fontSize: '14px', lineHeight: 1.5
                        }}>
                          {msg.message_text && <div>{msg.message_text}</div>}

                          {/* Render File Attachment Box */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ marginTop: msg.message_text ? '10px' : 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {msg.attachments.map((att, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '10px 14px', background: '#FFFFFF', borderRadius: '12px',
                                    border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', gap: '12px'
                                  }}
                                >
                                  <div style={{
                                    width: '36px', height: '36px', borderRadius: '8px', background: '#FEE2E2',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444'
                                  }}>
                                    <FaFilePdf size={18} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {att.file_name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748B' }}>{att.file_size || 'Document'}</div>
                                  </div>
                                  {att.file_url && (
                                    <a href={att.file_url} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>
                                      <FaDownload size={14} />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp & Double Blue Ticks */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                            gap: '4px', marginTop: '4px', fontSize: '10.5px', color: '#64748B'
                          }}>
                            <span>{formatTime(msg.created_at)}</span>
                            {isMe && <FaCheckDouble color="#2563EB" size={12} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Composer Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '16px 24px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}
              >
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '18px', cursor: 'pointer' }}
                  title="Emoji"
                >
                  <FaSmile />
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    flex: 1, padding: '12px 20px', background: '#F8FAFC',
                    border: '1px solid #E2E8F0', borderRadius: '24px',
                    color: '#0F172A', fontSize: '14px', outline: 'none'
                  }}
                />

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  multiple
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '18px', cursor: 'pointer' }}
                  title="Attach file"
                >
                  <FaPaperclip />
                </button>

                <button
                  type="submit"
                  disabled={sending || (!inputText.trim() && attachments.length === 0)}
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.35)'
                  }}
                >
                  <FaPaperPlane size={15} />
                </button>
              </form>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textAlign: 'center', color: '#64748B'
            }}>
              <div style={{
                width: '70px', height: '70px', borderRadius: '50%', background: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2563EB', fontSize: '30px', marginBottom: '16px'
              }}>
                💬
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Select a Chat to Start Messaging
              </h3>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#94A3B8' }}>
                Choose a contact from the left list or search for team members.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: NEW CHAT ── */}
      {showNewChatModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            width: '420px', background: '#FFFFFF', borderRadius: '20px', padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>New Direct Chat</h3>
              <button onClick={() => setShowNewChatModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Search user..."
              value={contactSearch}
              onChange={(e) => { setContactSearch(e.target.value); fetchContacts(e.target.value); }}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#F8FAFC',
                border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '14px', outline: 'none'
              }}
            />

            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contacts.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleStartDirectChat(c.id)}
                  style={{
                    padding: '10px 14px', borderRadius: '12px', background: '#F8FAFC',
                    cursor: 'pointer', border: '1px solid #E2E8F0', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>{c.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{c.role} • {c.email || c.mobile}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 800 }}>Chat →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
