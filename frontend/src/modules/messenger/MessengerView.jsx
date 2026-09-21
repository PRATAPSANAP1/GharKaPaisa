import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSearch, FaPaperclip, FaPaperPlane, FaSmile, FaUsers, 
  FaUser, FaFilePdf, FaFileAlt, FaCheckDouble, FaThumbtack, FaPlus, 
  FaTimes, FaPhone, FaVideo, FaEllipsisV, FaCircle, FaRedo,
  FaFilter, FaArrowLeft, FaDownload, FaCheck, FaUserPlus, FaVolumeMute,
  FaIdCard, FaCopy, FaEnvelope, FaUserCircle
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuthStore } from '../../app/store/authStore';

export function maskSensitiveData(text) {
  if (!text || typeof text !== 'string') return text;

  // 1. Mask PAN Card (5 letters + 4 digits + 1 letter -> ABCD******)
  let masked = text.replace(/\b([A-Za-z]{5}[0-9]{4}[A-Za-z]{1})\b/gi, (match) => {
    return match.slice(0, 4) + '******';
  });

  // 2. Mask +91 / 91 12-digit Indian mobile numbers (e.g. +919876543210 -> +919876******)
  masked = masked.replace(/(\+?91[\s-]?)?([6-9]\d{3})(\d{6})\b/g, (match, countryCode, prefix, lastSix) => {
    const code = countryCode || '';
    return `${code}${prefix}******`;
  });

  // 3. Mask standalone 10 to 12 digit phone number sequences
  masked = masked.replace(/\b([0-9]{4,6})([0-9]{6})\b/g, (match, prefix, lastSix) => {
    return `${prefix}******`;
  });

  return masked;
}

export default function MessengerView({ initialAppId = null, readOnly = false, targetUserId = null }) {
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

  // Modals & Popups
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [callStatus, setCallStatus] = useState(null); // { type: 'voice' | 'video', active: true }

  // User Profile Modal State
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const openUserProfile = (targetObj) => {
    if (!targetObj) return;
    const isDirectUser = activeConv?.conversation_type === 'DIRECT' ? activeConv.other_participants?.[0] : null;
    const source = targetObj.user_id || targetObj.sender_id || targetObj.full_name || targetObj.name ? targetObj : isDirectUser;
    if (!source) return;

    const isCurrentAdmin = (user?.role || '').toUpperCase() === 'ADMIN';
    const isTargetSuperAdmin = (source.role || source.sender_role || '').toUpperCase() === 'SUPER_ADMIN';

    const codeVal = source.partner_code || source.employee_code || source.sender_partner_code || source.sender_employee_code || source.user_code || source.code || 'N/A';

    const normalized = {
      id: source.id || source.user_id || source.sender_id,
      full_name: (isCurrentAdmin && !isTargetSuperAdmin)
        ? `Assigned Member (${codeVal})`
        : (source.full_name || source.name || source.sender_name || 'User Profile'),
      mobile: (isCurrentAdmin && !isTargetSuperAdmin) ? '[Protected]' : (source.mobile || source.sender_mobile || source.phone || 'N/A'),
      email: (isCurrentAdmin && !isTargetSuperAdmin) ? '[Protected]' : (source.email || source.sender_email || 'N/A'),
      code: codeVal,
      role: source.role || source.sender_role || 'Member',
      department: source.department || null,
      designation: source.designation || null,
      last_active_at: source.last_active_at,
      last_logout_at: source.last_logout_at,
      last_login: source.last_login
    };
    setSelectedProfileUser(normalized);
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text || text === 'N/A' || text === '[Protected]') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Contact list
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

  const quickEmojis = ['😊', '👍', '❤️', '🙏', '🚀', '🎉', '📝', '💡', '✅', '🔥', '👏', '🤝'];

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
      let res;
      if (readOnly && targetUserId) {
        res = await api.get('/messenger/admin/conversations', {
          params: { target_user_id: targetUserId }
        });
      } else {
        res = await api.get('/messenger/conversations', {
          params: { filter, search }
        });
      }
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
  }, [filter, search, targetUserId, readOnly]);

  useEffect(() => {
    if (initialAppId && !readOnly) {
      handleStartAppChat(initialAppId);
    }
  }, [initialAppId, readOnly]);

  // Auto-poll conversations & active chat messages
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
      if (activeConv) {
        fetchMessages(activeConv.id, false);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConv, filter, search, targetUserId, readOnly]);

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = async (convId, showLoader = true) => {
    if (showLoader) setLoadingMsgs(true);
    try {
      let res;
      if (readOnly && targetUserId) {
        res = await api.get(`/messenger/admin/messages/${convId}`, {
          params: { target_user_id: targetUserId }
        });
      } else {
        res = await api.get(`/messenger/conversations/${convId}/messages`);
      }
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
    setShowMoreMenu(false);
    setShowChatSearch(false);
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
    setShowEmojiPicker(false);
    setSending(true);

    try {
      const res = await api.post('/messenger/messages', payload);
      if (res.data?.success) {
        fetchMessages(activeConv.id, false);
        fetchConversations(false);
      }
    } catch (err) {
      console.error('Send message failed:', err);
      alert(err.response?.data?.message || 'Failed to send message.');
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

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
      alert(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleTogglePin = async () => {
    if (!activeConv) return;
    try {
      const res = await api.post(`/messenger/conversations/${activeConv.id}/pin`);
      if (res.data?.success) {
        setActiveConv(prev => ({ ...prev, is_pinned: res.data.data?.is_pinned }));
        fetchConversations(false);
        setShowMoreMenu(false);
      }
    } catch (err) {
      console.error('Toggle pin failed:', err);
    }
  };

  const toggleSelectContact = (id) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserStatusText = (userObj) => {
    if (!userObj) return { text: 'Offline', isOnline: false };

    const lastActive = userObj.last_active_at ? new Date(userObj.last_active_at).getTime() : null;
    const lastLogout = userObj.last_logout_at ? new Date(userObj.last_logout_at).getTime() : null;
    const lastLogin = userObj.last_login ? new Date(userObj.last_login).getTime() : null;

    const now = Date.now();
    const isRecentlyActive = Boolean(lastActive && (now - lastActive <= 180000));
    const isLoggedOut = Boolean(lastLogout && lastActive && lastLogout >= lastActive);

    if (isRecentlyActive && !isLoggedOut) {
      return { text: 'Active now', isOnline: true };
    }

    let lastSeenTs = (lastLogout && (!lastActive || lastLogout >= lastActive)) ? lastLogout : (lastActive || lastLogin);
    if (!lastSeenTs) {
      return { text: 'Offline', isOnline: false };
    }

    const seenDate = new Date(lastSeenTs);
    if (isNaN(seenDate.getTime())) return { text: 'Offline', isOnline: false };

    const diffMs = Math.max(0, now - seenDate.getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let timeStr = '';
    if (diffMins < 1) {
      timeStr = 'just now';
    } else if (diffMins < 60) {
      timeStr = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      timeStr = `${diffHours}h ago`;
    } else if (diffDays === 1) {
      const hours = seenDate.getHours();
      const minutes = String(seenDate.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      timeStr = `yesterday at ${formattedHours}:${minutes} ${ampm}`;
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const hours = seenDate.getHours();
      const minutes = String(seenDate.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      timeStr = `${seenDate.getDate()} ${months[seenDate.getMonth()]} at ${formattedHours}:${minutes} ${ampm}`;
    }

    return { text: `Last seen ${timeStr}`, isOnline: false };
  };

  const getActiveConvStatus = (conv) => {
    if (!conv) return { text: 'Offline', isOnline: false };
    if (conv.conversation_type === 'GROUP') {
      return { text: `${conv.participants?.length || 'Group'} members`, isOnline: true };
    }
    if (conv.conversation_type === 'APPLICATION') {
      return { text: `Application Channel #${conv.application_number || ''}`, isOnline: true };
    }
    const targetUser = conv.other_participants?.[0] || conv.participants?.find(p => (p.user_id || p.id) !== user?.id);
    return getUserStatusText(targetUser);
  };

  const getConvTitle = (conv) => {
    if (!conv) return 'Chat';
    const isCurrentAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

    if (conv.name) {
      if (isCurrentAdmin && conv.conversation_type === 'DIRECT') {
        const otherP = conv.other_participants?.[0];
        if (otherP && (otherP.role || '').toUpperCase() !== 'SUPER_ADMIN') {
          const code = otherP.partner_code || otherP.employee_code || `USR-${(otherP.user_id || otherP.id || '').slice(0, 6).toUpperCase()}`;
          return `Assigned Member (${code})`;
        }
      }
      return conv.name;
    }

    if (conv.other_participants && conv.other_participants.length > 0) {
      return conv.other_participants.map(p => {
        if (isCurrentAdmin && (p.role || '').toUpperCase() !== 'SUPER_ADMIN') {
          const code = p.partner_code || p.employee_code || `USR-${(p.user_id || p.id || '').slice(0, 6).toUpperCase()}`;
          return `Assigned Member (${code})`;
        }
        return p.full_name;
      }).join(', ');
    }
    return 'Direct Chat';
  };

  const filteredMessages = messages.filter(m => {
    if (!msgSearch.trim()) return true;
    return (m.message_text || '').toLowerCase().includes(msgSearch.toLowerCase());
  });

  return (
    <div style={{
      display: 'flex',
      height: isMobile ? 'calc(100vh - 65px)' : 'calc(100vh - 90px)',
      background: '#F8FAFC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      borderRadius: isMobile ? '0px' : '16px',
      overflow: 'hidden',
      border: isMobile ? 'none' : '1px solid #E2E8F0',
      boxShadow: isMobile ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
      position: 'relative'
    }}>

      {/* ── LEFT PANE: CHAT LIST ── */}
      {(!isMobile || !mobileShowChat) && (
        <div style={{
          width: isMobile ? '100%' : '360px',
          borderRight: isMobile ? 'none' : '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF'
        }}>
          {/* Top Search Header */}
          <div style={{ padding: isMobile ? '12px 14px' : '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Messages</h2>
              {!readOnly && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => { setShowNewChatModal(true); fetchContacts(''); }}
                    title="New Direct Chat"
                    style={{
                      width: '34px', height: '34px', borderRadius: '50%', background: '#EFF6FF',
                      border: '1px solid #BFDBFE', color: '#2563EB', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                    }}
                  >
                    <FaPlus size={13} />
                  </button>
                  <button
                    onClick={() => { setShowGroupModal(true); fetchContacts(''); }}
                    title="New Group Chat"
                    style={{
                      width: '34px', height: '34px', borderRadius: '50%', background: '#F1F5F9',
                      border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                    }}
                  >
                    <FaUsers size={14} />
                  </button>
                </div>
              )}
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
              <FaFilter 
                color={filter !== 'ALL' ? '#2563EB' : '#94A3B8'} 
                size={13} 
                title="Filter menu"
                onClick={() => setFilter(prev => prev === 'ALL' ? 'UNREAD' : 'ALL')}
                style={{ cursor: 'pointer', marginLeft: '6px' }} 
              />
            </div>

            {/* Sub Filter Chips */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
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
                    padding: '6px 14px', borderRadius: '16px', border: 'none',
                    background: filter === tab.id ? '#2563EB' : '#F1F5F9',
                    color: filter === tab.id ? '#FFFFFF' : '#64748B',
                    fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
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
                <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#475569' }}>No conversations found</p>
                <span>Click + above to start a chat with your team</span>
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
                      padding: isMobile ? '12px 14px' : '14px 20px', borderBottom: '1px solid #F8FAFC',
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* User / Group Avatar */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px', borderRadius: '50%',
                        background: conv.conversation_type === 'GROUP' ? '#3B82F6' : conv.conversation_type === 'APPLICATION' ? '#F59E0B' : '#0EA5E9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#fff', fontSize: isMobile ? '15px' : '17px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}>
                        {conv.conversation_type === 'GROUP' ? <FaUsers size={isMobile ? 17 : 20} /> : conv.conversation_type === 'APPLICATION' ? <FaFileAlt size={isMobile ? 15 : 18} /> : title.charAt(0).toUpperCase()}
                      </div>
                      <span style={{
                        position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px',
                        borderRadius: '50%',
                        background: conv.conversation_type === 'DIRECT' && getUserStatusText(conv.other_participants?.[0]).isOnline ? '#22C55E' : '#94A3B8',
                        border: '2px solid #FFFFFF'
                      }} />
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{
                          margin: 0, fontSize: isMobile ? '13.5px' : '14.5px', fontWeight: 700, color: '#0F172A',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '130px' : '160px',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                          {conv.is_pinned && <FaThumbtack size={10} color="#2563EB" />}
                          {title}
                        </h4>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                          {formatTime(conv.last_message_at || conv.created_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{
                          margin: 0, fontSize: '12.5px', color: '#64748B', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '160px' : '170px'
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', position: 'relative' }}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: isMobile ? '10px 14px' : '14px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)', position: 'relative', zIndex: 10
              }}>
                <div 
                  onClick={() => openUserProfile(activeConv.other_participants?.[0] || { full_name: getConvTitle(activeConv) })}
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px', cursor: 'pointer', minWidth: 0 }}
                  title="Click to view User Profile"
                >
                  {isMobile && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMobileShowChat(false); }}
                      style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '16px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <FaArrowLeft />
                    </button>
                  )}

                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: isMobile ? '36px' : '42px', height: isMobile ? '36px' : '42px', borderRadius: '50%',
                      background: activeConv.conversation_type === 'GROUP' ? '#3B82F6' : '#0EA5E9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#fff', fontSize: isMobile ? '15px' : '17px'
                    }}>
                      {activeConv.conversation_type === 'GROUP' ? <FaUsers size={isMobile ? 17 : 20} /> : getConvTitle(activeConv).charAt(0).toUpperCase()}
                    </div>
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0, width: '9px', height: '9px',
                      borderRadius: '50%',
                      background: getActiveConvStatus(activeConv).isOnline ? '#22C55E' : '#94A3B8',
                      border: '2px solid #FFFFFF'
                    }} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '14px' : '15.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '120px' : '220px' }}>
                      {getConvTitle(activeConv)}
                      {activeConv.is_pinned && <FaThumbtack size={10} color="#2563EB" title="Pinned Chat" />}
                    </h3>
                    <span style={{ fontSize: isMobile ? '11px' : '12px', color: getActiveConvStatus(activeConv).isOnline ? '#22C55E' : '#64748B', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: isMobile ? '120px' : '220px' }}>
                      {getActiveConvStatus(activeConv).text}
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '14px', color: '#64748B', position: 'relative' }}>
                  <button
                    onClick={() => setShowChatSearch(prev => !prev)}
                    title="Search Messages"
                    style={{ background: 'transparent', border: 'none', color: showChatSearch ? '#2563EB' : '#64748B', cursor: 'pointer', padding: '6px' }}
                  >
                    <FaSearch size={isMobile ? 14 : 16} />
                  </button>
                  {!isMobile && (
                    <>
                      <button
                        onClick={() => setCallStatus({ type: 'voice', active: true })}
                        title="Voice Call"
                        style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px' }}
                      >
                        <FaPhone size={15} />
                      </button>
                      <button
                        onClick={() => setCallStatus({ type: 'video', active: true })}
                        title="Video Call"
                        style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px' }}
                      >
                        <FaVideo size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowMoreMenu(prev => !prev)}
                    title="More Options"
                    style={{ background: 'transparent', border: 'none', color: showMoreMenu ? '#2563EB' : '#64748B', cursor: 'pointer', padding: '6px' }}
                  >
                    <FaEllipsisV size={isMobile ? 14 : 15} />
                  </button>

                  {/* Dropdown Options Menu */}
                  {showMoreMenu && (
                    <div style={{
                      position: 'absolute', top: '38px', right: 0, background: '#FFFFFF',
                      border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px 0',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '190px', zIndex: 100
                    }}>
                      <div
                        onClick={() => { openUserProfile(activeConv.other_participants?.[0] || { full_name: getConvTitle(activeConv) }); setShowMoreMenu(false); }}
                        style={{ padding: '10px 16px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <FaUserCircle size={14} color="#2563EB" />
                        <span>View User Profile</span>
                      </div>
                      {isMobile && (
                        <>
                          <div
                            onClick={() => { setCallStatus({ type: 'voice', active: true }); setShowMoreMenu(false); }}
                            style={{ padding: '10px 16px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          >
                            <FaPhone size={13} color="#2563EB" />
                            <span>Voice Call</span>
                          </div>
                          <div
                            onClick={() => { setCallStatus({ type: 'video', active: true }); setShowMoreMenu(false); }}
                            style={{ padding: '10px 16px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          >
                            <FaVideo size={13} color="#2563EB" />
                            <span>Video Call</span>
                          </div>
                        </>
                      )}
                      <div
                        onClick={handleTogglePin}
                        style={{ padding: '10px 16px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <FaThumbtack size={12} color="#2563EB" />
                        <span>{activeConv.is_pinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                      </div>
                      <div
                        onClick={() => { alert('Notifications muted'); setShowMoreMenu(false); }}
                        style={{ padding: '10px 16px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <FaVolumeMute size={13} color="#64748B" />
                        <span>Mute Notifications</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Search Bar */}
              {showChatSearch && (
                <div style={{ padding: isMobile ? '8px 14px' : '10px 24px', background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaSearch color="#2563EB" size={13} />
                  <input
                    type="text"
                    placeholder="Search in this conversation..."
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#1E3A8A' }}
                  />
                  {msgSearch && (
                    <button onClick={() => setMsgSearch('')} style={{ background: 'transparent', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: '12px' }}>Clear</button>
                  )}
                </div>
              )}

              {/* Chat Messages Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 12px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '40px' }}>
                    Loading conversation...
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '60px' }}>
                    <p style={{ fontWeight: 700, color: '#334155', fontSize: '15px', margin: '0 0 4px' }}>
                      {msgSearch ? 'No messages match search' : 'Say hi to start the conversation!'}
                    </p>
                    <span>{msgSearch ? 'Try a different keyword' : 'Type your message in the box below.'}</span>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    const isReadByReceiver = Boolean(
                      msg.is_read ||
                      (Array.isArray(msg.reads) && msg.reads.some(r => r.user_id && r.user_id !== msg.sender_id))
                    );

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {!isMe && (
                          <span 
                            onClick={() => openUserProfile(msg)}
                            title="Click to view profile details"
                            style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', marginBottom: '3px', marginLeft: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FaUserCircle size={11} /> {msg.sender_name || 'Member'}
                          </span>
                        )}
                        <div style={{
                          maxWidth: isMobile ? '85%' : '65%', padding: isMobile ? '10px 14px' : '12px 18px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe ? '#DBEAFE' : '#FFFFFF',
                          border: isMe ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                          color: '#1E293B',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          fontSize: isMobile ? '13.5px' : '14px', lineHeight: 1.5
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

                          {/* Timestamp & Double Ticks (Grey for sent, Blue when read by receiver) */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                            gap: '4px', marginTop: '4px', fontSize: '10.5px', color: '#64748B'
                          }}>
                            <span>{formatTime(msg.created_at)}</span>
                            {isMe && (
                              <FaCheckDouble
                                color={isReadByReceiver ? '#2563EB' : '#94A3B8'}
                                size={13}
                                title={isReadByReceiver ? 'Read by recipient' : 'Sent'}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Pending Attachments Chip Bar */}
              {attachments.length > 0 && (
                <div style={{ padding: '8px 16px', background: '#EFF6FF', borderTop: '1px solid #BFDBFE', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  {attachments.map((att, idx) => (
                    <div key={idx} style={{ padding: '6px 12px', background: '#FFFFFF', border: '1px solid #93C5FD', borderRadius: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
                      <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{att.file_name}</span>
                      <FaTimes size={12} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => removeAttachment(idx)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Emoji Picker Popup Overlay */}
              {showEmojiPicker && (
                <div style={{
                  position: 'absolute', bottom: isMobile ? '60px' : '70px', left: isMobile ? '10px' : '24px', right: isMobile ? '10px' : 'auto',
                  background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '16px', padding: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '8px', zIndex: 100
                }}>
                  {quickEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { setInputText(prev => prev + emoji); setShowEmojiPicker(false); }}
                      style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Composer Bar */}
              {readOnly ? (
                <div style={{
                  padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0',
                  textAlign: 'center', color: '#64748B', fontWeight: 700, fontSize: '13.5px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                  <FaLock color="#DC2626" /> Read-Only Mode (Super Admin Audit). Messaging disabled.
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: isMobile ? '10px 12px' : '16px 24px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    style={{ background: 'transparent', border: 'none', color: showEmojiPicker ? '#2563EB' : '#64748B', fontSize: '18px', cursor: 'pointer' }}
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
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                      opacity: (sending || (!inputText.trim() && attachments.length === 0)) ? 0.6 : 1
                    }}
                  >
                    <FaPaperPlane size={14} />
                  </button>
                </form>
              )}
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

      {/* ── MODAL: NEW DIRECT CHAT ── */}
      {showNewChatModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            width: isMobile ? '100%' : '420px', maxWidth: '440px', background: '#FFFFFF', borderRadius: '20px', padding: isMobile ? '18px' : '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>New Direct Chat</h3>
              <button onClick={() => setShowNewChatModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px' }}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Search user name or role..."
              value={contactSearch}
              onChange={(e) => { setContactSearch(e.target.value); fetchContacts(e.target.value); }}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#F8FAFC',
                border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '14px', outline: 'none'
              }}
            />

            <div style={{ maxHeight: isMobile ? '50vh' : '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contacts.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleStartDirectChat(c.id)}
                  style={{
                    padding: '10px 14px', borderRadius: '12px', background: '#F8FAFC',
                    cursor: 'pointer', border: '1px solid #E2E8F0', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s'
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

      {/* ── MODAL: NEW GROUP CHAT ── */}
      {showGroupModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            width: isMobile ? '100%' : '460px', maxWidth: '480px', background: '#FFFFFF', borderRadius: '20px', padding: isMobile ? '18px' : '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>Create Group Chat</h3>
              <button onClick={() => setShowGroupModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Group Name *</label>
              <input
                type="text"
                placeholder="e.g. Credit Operations Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief group topic..."
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 14px', background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none'
                }}
              />
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Select Members</label>
            <input
              type="text"
              placeholder="Search team members..."
              value={contactSearch}
              onChange={(e) => { setContactSearch(e.target.value); fetchContacts(e.target.value); }}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: '#F8FAFC',
                border: '1px solid #E2E8F0', borderRadius: '10px', marginBottom: '10px', outline: 'none', fontSize: '13px'
              }}
            />

            <div style={{ maxHeight: isMobile ? '35vh' : '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
              {contacts.map(c => {
                const isSelected = selectedContactIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelectContact(c.id)}
                    style={{
                      padding: '8px 12px', borderRadius: '10px', background: isSelected ? '#EFF6FF' : '#F8FAFC',
                      cursor: 'pointer', border: `1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{c.full_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{c.role}</div>
                    </div>
                    {isSelected && <FaCheck color="#2563EB" size={13} />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleCreateGroup}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', background: '#2563EB',
                color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer'
              }}
            >
              Create Group
            </button>
          </div>
        </div>
      )}

      {/* ── CALL MODAL ── */}
      {callStatus?.active && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000, color: '#FFFFFF', padding: '20px'
        }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '20px' }}>
            {callStatus.type === 'video' ? <FaVideo /> : <FaPhone />}
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, textAlign: 'center' }}>Calling {getConvTitle(activeConv)}...</h3>
          <p style={{ margin: '0 0 30px', fontSize: '14px', color: '#94A3B8', textAlign: 'center' }}>Establishing secure end-to-end encrypted {callStatus.type} connection</p>
          <button
            onClick={() => setCallStatus(null)}
            style={{ padding: '12px 30px', borderRadius: '24px', background: '#EF4444', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
          >
            End Call
          </button>
        </div>
      )}

      {/* ── MODAL: USER PROFILE CARD (Name, Number, Partner/User Code) ── */}
      {selectedProfileUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 99999, padding: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            width: isMobile ? '100%' : '420px', maxWidth: '440px', background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', maxHeight: '92vh', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
              padding: '24px', color: '#FFFFFF', position: 'relative', textAlign: 'center'
            }}>
              <button
                onClick={() => setSelectedProfileUser(null)}
                style={{
                  position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)',
                  border: 'none', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                }}
              >
                ✕
              </button>

              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', background: '#FFFFFF',
                color: '#2563EB', fontWeight: 900, fontSize: '28px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)', border: '3px solid rgba(255,255,255,0.8)'
              }}>
                {(selectedProfileUser.full_name || 'U').charAt(0).toUpperCase()}
              </div>

              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
                {selectedProfileUser.full_name}
              </h2>
              
              <span style={{
                display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '3px 12px',
                borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {selectedProfileUser.role || 'Member'}
              </span>
            </div>

            {/* Content Details List */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* 1. Name */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaUser size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Full Name</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selectedProfileUser.full_name}</div>
                  </div>
                </div>
              </div>

              {/* 2. Mobile Number */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaPhone size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Mobile Number</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selectedProfileUser.mobile}</div>
                  </div>
                </div>
                {selectedProfileUser.mobile && selectedProfileUser.mobile !== 'N/A' && (
                  <button
                    onClick={() => copyToClipboard(selectedProfileUser.mobile, 'mobile')}
                    style={{ background: 'transparent', border: 'none', color: copiedField === 'mobile' ? '#059669' : '#64748B', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FaCopy size={13} /> {copiedField === 'mobile' ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              {/* 3. User / Partner / Employee Code */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaIdCard size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>User / Partner Code</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#D97706', letterSpacing: '0.5px' }}>{selectedProfileUser.code}</div>
                  </div>
                </div>
                {selectedProfileUser.code && selectedProfileUser.code !== 'N/A' && (
                  <button
                    onClick={() => copyToClipboard(selectedProfileUser.code, 'code')}
                    style={{ background: 'transparent', border: 'none', color: copiedField === 'code' ? '#D97706' : '#64748B', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FaCopy size={13} /> {copiedField === 'code' ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              {/* 4. Email */}
              {selectedProfileUser.email && selectedProfileUser.email !== 'N/A' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #F1F5F9' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaEnvelope size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Email Address</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{selectedProfileUser.email}</div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {selectedProfileUser.id && selectedProfileUser.id !== user?.id && (
                  <button
                    onClick={() => {
                      handleStartDirectChat(selectedProfileUser.id);
                      setSelectedProfileUser(null);
                    }}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '14px', background: '#2563EB',
                      color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer',
                      fontSize: '14px', boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                    }}
                  >
                    💬 Start Chat
                  </button>
                )}
                <button
                  onClick={() => setSelectedProfileUser(null)}
                  style={{
                    padding: '12px 20px', borderRadius: '14px', background: '#F1F5F9',
                    color: '#475569', fontWeight: 700, border: 'none', cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
