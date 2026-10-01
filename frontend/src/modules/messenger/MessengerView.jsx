import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaSearch, FaPaperclip, FaPaperPlane, FaSmile, FaUsers, 
  FaUser, FaFilePdf, FaFileAlt, FaCheckDouble, FaThumbtack, FaPlus, 
  FaTimes, FaPhone, FaVideo, FaEllipsisV, FaCircle, FaRedo,
  FaFilter, FaArrowLeft, FaDownload, FaCheck, FaUserPlus, FaVolumeMute,
  FaIdCard, FaCopy, FaEnvelope, FaUserCircle, FaTrashAlt, FaLock, FaSignOutAlt, FaEdit, FaImage,
  FaMicrophone, FaSearchPlus, FaBell, FaMinus
} from 'react-icons/fa';
import api from '../../services/api';
import { getImageUrl } from '../../config/api';
import { useAuthStore } from '../../app/store/authStore';
import { getMessengerSocket } from '../../services/messengerSocket';
import MessengerCallModal from './MessengerCallModal';

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

export function normalizeMessengerAttachment(att) {
  if (!att) return null;
  const id = att.id || att.attachmentId || att.attachment_id || att.media_id;
  let fileUrl = att.file_url || att.url || att.fileUrl || att.media_url;
  if (!fileUrl && id) {
    fileUrl = `/api/v1/messenger/media/${id}`;
  }
  const fileName = att.file_name || att.fileName || att.name || 'Attachment';
  const fileType = (att.file_type || att.mime_type || att.fileType || att.mimeType || '').toUpperCase();
  const fileSize = att.file_size || att.fileSize || att.size || '';

  const isImg = fileType === 'IMAGE' ||
                fileType.startsWith('IMAGE/') ||
                /\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i.test(fileUrl || fileName || '') ||
                (fileUrl && fileUrl.startsWith('blob:'));

  return {
    id,
    fileUrl,
    fileName,
    fileType,
    fileSize,
    isImg
  };
}

export function AuthenticatedImage({ src, alt, style, onClick, onError, ...props }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let localUrl = null;

    if (!src) {
      setLoading(false);
      if (onError) onError();
      return;
    }

    // Direct render for data URIs and local blob URLs
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setBlobUrl(src);
      setLoading(false);
      return;
    }

    const isMessengerMedia = src.includes('/messenger/media/') || src.includes('/api/v1/messenger/media/');

    // For external non-messenger HTTP/HTTPS URLs, render directly
    if ((src.startsWith('http://') || src.startsWith('https://')) && !isMessengerMedia) {
      setBlobUrl(src);
      setLoading(false);
      return;
    }

    // Extract relative endpoint path for api.get (e.g. /messenger/media/:id)
    let fetchPath = src;
    if (fetchPath.startsWith('http://') || fetchPath.startsWith('https://')) {
      try {
        const parsed = new URL(src);
        fetchPath = parsed.pathname + parsed.search;
      } catch (e) {
        fetchPath = src;
      }
    }
    if (fetchPath.startsWith('/api/v1')) {
      fetchPath = fetchPath.slice('/api/v1'.length);
    }

    console.log('[MESSENGER MEDIA FETCH START]', src);

    api.get(fetchPath, { responseType: 'blob' })
      .then((res) => {
        if (isMounted) {
          console.log('[MESSENGER MEDIA FETCH SUCCESS]', {
            src,
            status: res.status,
            contentType: res.headers?.['content-type']
          });
          localUrl = URL.createObjectURL(res.data);
          setBlobUrl(localUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[MESSENGER MEDIA FETCH FAILED]', {
          src,
          status: err?.response?.status,
          message: err?.message
        });
        if (isMounted) {
          setLoading(false);
          setBlobUrl(null);
          if (onError) onError(err);
        }
      });

    return () => {
      isMounted = false;
      if (localUrl) {
        try { URL.revokeObjectURL(localUrl); } catch (e) {}
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div style={{
        width: '180px', height: '120px', background: '#F1F5F9',
        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94A3B8', fontSize: '11px', fontWeight: 600
      }}>
        Loading image...
      </div>
    );
  }

  if (!blobUrl) return null;

  return (
    <img
      src={blobUrl}
      alt={alt}
      style={style}
      onClick={onClick}
      onError={onError}
      {...props}
    />
  );
}

export default function MessengerView({ initialAppId = null, readOnly = false, targetUserId = null }) {
  const user = useAuthStore((state) => state.user);


  const isSuperAdmin = (user?.role || '').toUpperCase() === 'SUPER_ADMIN';

  const isSuperAdminOrSharad = 
    isSuperAdmin ||
    (user?.full_name || '').toLowerCase().includes('sharad yohesa') ||
    (user?.full_name || '').toLowerCase().includes('sharad') ||
    (user?.email || '').toLowerCase().includes('sharad');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Edit Group Name State (Super Admin Only)
  const [showEditGroupNameModal, setShowEditGroupNameModal] = useState(false);
  const [editingGroupNameText, setEditingGroupNameText] = useState('');
  const [savingGroupName, setSavingGroupName] = useState(false);

  const handleOpenEditGroupName = () => {
    if (!activeConv || !isSuperAdmin) return;
    setEditingGroupNameText(activeConv.name || '');
    setShowEditGroupNameModal(true);
  };

  const handleSaveGroupName = async (e) => {
    e?.preventDefault();
    if (!activeConv || !editingGroupNameText.trim() || !isSuperAdmin) return;
    setSavingGroupName(true);
    try {
      const res = await api.put(`/messenger/conversations/${activeConv.id}/name`, {
        name: editingGroupNameText.trim()
      });
      if (res.data?.success) {
        const updatedName = res.data.data?.name || editingGroupNameText.trim();
        setActiveConv(prev => prev ? { ...prev, name: updatedName } : prev);
        setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, name: updatedName } : c));
        setShowEditGroupNameModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update group name.');
    } finally {
      setSavingGroupName(false);
    }
  };

  // Modals & Popups
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [callStatus, setCallStatus] = useState(null); // { type: 'voice' | 'video', active: true }
  const [activeCall, setActiveCall] = useState(null); // Active WebRTC Call Session

  // Listen for real-time incoming WebRTC call socket events
  useEffect(() => {
    const socket = getMessengerSocket();
    if (!socket) return;

    if (user?.id) {
      console.log(`[CALL SOCKET] userId=${user.id} socketId=${socket.id} connected=${socket.connected} room=user:${user.id}`);
    }

    const handleIncomingCall = (data) => {
      console.log('[CALL DEBUG] incoming call event received', data);
      console.log('[CALL DEBUG] incoming caller ID:', data.caller_id);
      console.log('[CALL DEBUG] incoming call type:', data.call_type);
      console.log('[CALL DEBUG] showing incoming call UI');

      setActiveCall({
        callId: data.call_id,
        callerId: data.caller_id,
        callerName: data.caller_name || 'Incoming Call',
        callType: data.call_type || 'voice',
        isIncoming: true,
        conversationId: data.conversation_id,
        sdp: data.sdp || null
      });
    };

    socket.on('call:incoming', handleIncomingCall);
    return () => {
      socket.off('call:incoming', handleIncomingCall);
    };
  }, [user?.id]);

  const handleInitiateCall = (callType) => {
    console.log('[CALL DEBUG] initiate');

    if (!activeConv) return;
    if (activeConv.conversation_type === 'GROUP' || activeConv.conversation_type === 'DEPARTMENT') {
      alert('Group audio/video calls are coming soon! Only 1-on-1 calls are currently supported.');
      return;
    }

    const socket = getMessengerSocket();
    const isSocketConnected = Boolean(socket && socket.connected);
    console.log('[CALL DEBUG] socket connected:', isSocketConnected);

    if (!isSocketConnected) {
      alert('Unable to initiate call. Messenger socket connection is not active.');
      return;
    }

    const counterpart = 
      activeConv.other_participants?.find(p => (p.user_id || p.id) !== user?.id) ||
      activeConv.participants?.find(p => (p.user_id || p.id) !== user?.id) ||
      activeConv.other_participants?.[0] ||
      activeConv.participants?.[0];

    const recipientUserId = 
      counterpart?.user_id ||
      (counterpart?.id && String(counterpart.id) !== String(user?.id) ? counterpart.id : null) ||
      activeConv.target_user_id ||
      activeConv.participant_user_id ||
      (activeConv.user_id !== user?.id ? activeConv.user_id : null);

    console.log('[CALL DEBUG] receiverUserId:', recipientUserId);

    if (!recipientUserId) {
      alert('Unable to identify call recipient user ID.');
      return;
    }

    setActiveCall({
      recipientId: recipientUserId,
      recipientName: getConvTitle(activeConv),
      callType,
      isIncoming: false,
      conversationId: activeConv.id
    });
  };

  // Message Editing & Deletion State
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [failedImageUrls, setFailedImageUrls] = useState({});
  const [previewImgError, setPreviewImgError] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const openPreviewModal = (url) => {
    setPreviewImgError(false);
    setZoomScale(1);
    setPreviewImageUrl(url);
  };

  const handleEditMessage = async (msgId) => {
    if (!editingText.trim()) return;
    try {
      const res = await api.put(`/messenger/messages/${msgId}`, { message_text: editingText });
      if (res.data?.success) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, message_text: editingText, is_edited: true } : m));
        setEditingMsgId(null);
        setEditingText('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit message.');
    }
  };

  const handleDeleteSingleMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await api.delete(`/messenger/messages/${msgId}`);
      if (res.data?.success) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete message.');
    }
  };

  // User Profile Modal State
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const openUserProfile = (targetObj) => {
    if (!targetObj) return;
    const isDirectUser = activeConv?.conversation_type === 'DIRECT' ? activeConv.other_participants?.[0] : null;
    const source = targetObj.user_id || targetObj.sender_id || targetObj.full_name || targetObj.name ? targetObj : isDirectUser;
    if (!source) return;

    const codeVal = source.partner_code || source.employee_code || source.sender_partner_code || source.sender_employee_code || source.user_code || source.code || 'N/A';

    const normalized = {
      id: source.id || source.user_id || source.sender_id,
      full_name: isSuperAdminOrSharad
        ? ((source.full_name && source.full_name !== 'User Profile') ? source.full_name : (source.name || source.sender_name || (source.first_name ? `${source.first_name} ${source.last_name || ''}`.trim() : '') || source.email || 'User Profile'))
        : (codeVal && codeVal !== 'N/A' ? codeVal : 'User'),
      mobile: isSuperAdminOrSharad ? (source.mobile || source.sender_mobile || source.phone || 'N/A') : '[Protected]',
      email: isSuperAdminOrSharad ? (source.email || source.sender_email || 'N/A') : '[Protected]',
      code: isSuperAdminOrSharad ? codeVal : '[Protected]',
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

  // Group Members Modal State
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [showAddGroupMemberSection, setShowAddGroupMemberSection] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberContacts, setAddMemberContacts] = useState([]);
  const [selectedAddUserIds, setSelectedAddUserIds] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(null);

  const openGroupMembersModal = async (conv) => {
    if (!conv || conv.conversation_type !== 'GROUP') return;
    setShowGroupMembersModal(true);
    setShowAddGroupMemberSection(false);
    setSelectedAddUserIds([]);
    setAddMemberSearch('');
    setLoadingGroupMembers(true);
    try {
      const res = await api.get(`/messenger/conversations/${conv.id}/members`);
      if (res.data?.success) {
        setGroupMembers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch group members:', err);
      alert(err.response?.data?.message || 'Failed to load group members.');
    } finally {
      setLoadingGroupMembers(false);
    }
  };

  const handleOpenAddMemberSection = async () => {
    const nextState = !showAddGroupMemberSection;
    setShowAddGroupMemberSection(nextState);
    if (nextState) {
      fetchAddMemberContacts('');
    }
  };

  const fetchAddMemberContacts = async (queryText = '') => {
    try {
      const res = await api.get('/messenger/contacts', { params: { query: queryText } });
      if (res.data?.success) {
        const existingIds = new Set(groupMembers.map(m => m.user_id || m.id));
        const filtered = (res.data.data || []).filter(c => !existingIds.has(c.id));
        setAddMemberContacts(filtered);
      }
    } catch (err) {
      console.error('Failed to search add member contacts:', err);
    }
  };

  const handleAddGroupMembersSubmit = async () => {
    if (!activeConv || !selectedAddUserIds.length) return alert('Please select at least one contact to add.');
    setAddingMembers(true);
    try {
      const res = await api.post(`/messenger/conversations/${activeConv.id}/members`, {
        member_user_ids: selectedAddUserIds
      });
      if (res.data?.success) {
        setGroupMembers(res.data.data || []);
        setSelectedAddUserIds([]);
        setShowAddGroupMemberSection(false);
        fetchMessages(activeConv.id, false);
        fetchConversations(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add members.');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveGroupMemberItem = async (targetUserId, targetName) => {
    if (!activeConv) return;
    if (!window.confirm(`Are you sure you want to remove "${targetName}" from this group?`)) return;
    setRemovingUserId(targetUserId);
    try {
      const res = await api.delete(`/messenger/conversations/${activeConv.id}/members/${targetUserId}`);
      if (res.data?.success) {
        setGroupMembers(res.data.data || []);
        fetchMessages(activeConv.id, false);
        fetchConversations(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove group member.');
    } finally {
      setRemovingUserId(null);
    }
  };

  // Contact list
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState([]);

  // Super Admin Assign Messenger State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [accountsList, setAccountsList] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedMessengerIds, setSelectedMessengerIds] = useState([]);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const fetchAccountsAndAssignments = async () => {
    if ((user?.role || '').toUpperCase() !== 'SUPER_ADMIN') return;
    setLoadingAssignments(true);
    try {
      const [accRes, assignRes] = await Promise.all([
        api.get('/messenger/admin/accounts'),
        api.get('/messenger/admin/assignments')
      ]);
      if (accRes.data?.success) setAccountsList(accRes.data.data || []);
      if (assignRes.data?.success) setExistingAssignments(assignRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch accounts or assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleAssignMessengersSubmit = async (e) => {
    e?.preventDefault();
    if ((user?.role || '').toUpperCase() !== 'SUPER_ADMIN') return alert('Access denied. Super Admin role required.');
    if (!selectedAccountId) return alert('Please select an account.');
    if (!selectedMessengerIds.length) return alert('Please select at least one messenger contact to assign.');
    setSavingAssignment(true);
    try {
      const res = await api.post('/messenger/admin/assignments', {
        account_user_id: selectedAccountId,
        assigned_messenger_user_ids: selectedMessengerIds
      });
      if (res.data?.success) {
        alert('Messenger contacts assigned successfully!');
        setSelectedAccountId('');
        setSelectedMessengerIds([]);
        fetchAccountsAndAssignments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign messengers.');
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleRemoveAssignmentItem = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this messenger assignment?')) return;
    try {
      const res = await api.delete(`/messenger/admin/assignments/${assignmentId}`);
      if (res.data?.success) {
        setExistingAssignments(prev => prev.filter(a => a.id !== assignmentId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove assignment.');
    }
  };

  // File & Image Upload
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Controlled Scroll State & Refs
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const hasInitialScrolledRef = useRef(false);
  const prevMessagesRef = useRef([]);
  const prevConvIdRef = useRef(null);
  const isUserSentMessageRef = useRef(false);


  // Copy & Emoji State
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [activeEmojiTab, setActiveEmojiTab] = useState('DIGITS');
  const [emojiSearch, setEmojiSearch] = useState('');

  // Reaction Emoji State
  const [reactionsMap, setReactionsMap] = useState({}); // { [msgId]: emojiSymbol }
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);

  const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

  const handleToggleReaction = (msgId, emoji) => {
    setReactionsMap(prev => {
      const current = prev[msgId];
      if (current === emoji) {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      }
      return { ...prev, [msgId]: emoji };
    });
    setActiveReactionPickerMsgId(null);
  };

  const isMessageWithin5Minutes = (msg) => {
    if (!msg || !msg.created_at) return false;
    const createdAt = new Date(msg.created_at).getTime();
    if (isNaN(createdAt)) return false;
    const diffMinutes = (Date.now() - createdAt) / (1000 * 60);
    return diffMinutes <= 5;
  };

  // Comprehensive Emojis including 0-9 Digits
  const EMOJI_CATEGORIES = [
    {
      id: 'DIGITS',
      name: '0-9 Digits',
      emojis: ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '#️⃣', '*️⃣', '🔢', '🔣', '1️⃣0️⃣']
    },
    {
      id: 'SMILEYS',
      name: 'Smileys',
      emojis: ['😊', '😂', '😍', '🥰', '😎', '😭', '🤔', '😅', '🥳', '🤩', '😇', '😃', '🙄', '😬', '🙌', '😴', '😷', '🤖', '👻']
    },
    {
      id: 'HANDS',
      name: 'Hands & People',
      emojis: ['👍', '👎', '🙏', '👏', '🤝', '👋', '✌️', '🤞', '💪', '👈', '👉', '👆', '👇', '👊', '👤', '👥']
    },
    {
      id: 'SYMBOLS',
      name: 'Symbols & Hearts',
      emojis: ['❤️', '💙', '💚', '💛', '💜', '🧡', '🖤', '💔', '🔥', '✨', '🎉', '💯', '✅', '❌', '⭐', '⚡', '🔔', '📢', '💬']
    },
    {
      id: 'OBJECTS',
      name: 'Objects & Work',
      emojis: ['📱', '💻', '📞', '📄', '📝', '💼', '💰', '💳', '📊', '📈', '🏠', '🚗', '📌', '📍', '💡', '🚀', '🎁', '🏆', '🎯']
    }
  ];

  // ── Object URL & Blob Lifecycle Management ──────────────────────
  const createdBlobUrlsRef = useRef(new Set());

  const createTrackedBlobUrl = (file) => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    createdBlobUrlsRef.current.add(url);
    return url;
  };

  const revokeTrackedBlobUrl = (url) => {
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
      if (createdBlobUrlsRef.current.has(url)) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
        createdBlobUrlsRef.current.delete(url);
      }
    }
  };

  // Cleanup unrevoked Blob URLs on component unmount
  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) {}
      });
      createdBlobUrlsRef.current.clear();
    };
  }, []);

  // File Input Selection Handler
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments = files.map(file => {
      const isImg = file.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const objectUrl = createTrackedBlobUrl(file);
      return {
        file_name: file.name,
        file_type: isImg ? 'IMAGE' : isPdf ? 'PDF' : 'DOCUMENT',
        file_size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        file_url: objectUrl,
        previewUrl: objectUrl,
        file_blob: file
      };
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    if (e.target) e.target.value = '';
  };

  // Clipboard Paste Image Handler
  const handlePaste = (e) => {
    if (readOnly) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasPastedImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          hasPastedImage = true;
          const objectUrl = createTrackedBlobUrl(file);
          const newAtt = {
            file_name: `Pasted_Image_${Date.now()}.png`,
            file_type: 'IMAGE',
            file_size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            file_url: objectUrl,
            previewUrl: objectUrl,
            file_blob: file
          };
          setAttachments(prev => [...prev, newAtt]);
        }
      }
    }
    if (hasPastedImage) {
      e.preventDefault();
    }
  };

  // Remove Attachment Helper
  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => {
      const target = prev[indexToRemove];
      if (target) {
        if (target.previewUrl) revokeTrackedBlobUrl(target.previewUrl);
        if (target.file_url) revokeTrackedBlobUrl(target.file_url);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // Image Download Helper
  const handleDownloadImage = async (rawUrl, fileName = 'image.png') => {
    if (!rawUrl) return;
    try {
      const response = await api.get(rawUrl, { responseType: 'blob' });
      const blob = response.data;
      const blobUrl = createTrackedBlobUrl(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || `downloaded_image_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => revokeTrackedBlobUrl(blobUrl), 10000);
    } catch (err) {
      alert('Failed to download image. Session may have expired or access denied.');
    }
  };

  // Image Copy Helper
  const handleCopyImage = async (rawUrl) => {
    if (!rawUrl) return;
    try {
      const response = await api.get(rawUrl, { responseType: 'blob' });
      const blob = response.data;
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob })
      ]);
      alert('Image copied to clipboard!');
    } catch (err) {
      alert('Failed to copy image.');
    }
  };

  // Message Text Copy Helper
  const handleCopyMessageText = (text, msgId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

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

  // Helper to sort conversations: pinned conversations at top, followed by latest message/update timestamp descending
  const sortConversationsList = (list = []) => {
    return [...list].sort((a, b) => {
      const isPinnedA = Boolean(a.is_pinned);
      const isPinnedB = Boolean(b.is_pinned);
      if (isPinnedA !== isPinnedB) {
        return isPinnedA ? -1 : 1;
      }
      const timeA = new Date(a.last_message_at || a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.last_message_at || b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  };

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
        setConversations(sortConversationsList(res.data.data || []));
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

  // Auto-poll conversations & active chat messages with visibility awareness to save bandwidth/DB load
  useEffect(() => {
    let interval = null;
    const pollUpdates = () => {
      if (document.hidden) return;
      fetchConversations(false);
      if (activeConv) {
        fetchMessages(activeConv.id, false);
      }
    };

    interval = setInterval(pollUpdates, 5000);

    const handleVisibilityChange = () => {
      if (!document.hidden) pollUpdates();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeConv, filter, search, targetUserId, readOnly]);

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = async (convId, showLoader = true) => {
    if (showLoader) setLoadingMsgs(true);
    try {
      let res;
      if (readOnly && targetUserId) {
        res = await api.get(`/messenger/admin/messages/${convId}`, {
          params: { target_user_id: targetUserId, limit: 5000 }
        });
      } else {
        res = await api.get(`/messenger/conversations/${convId}/messages`, {
          params: { limit: 5000 }
        });
      }
      if (res.data?.success) {
        setMessages(res.data.data || []);
        if (!readOnly) {
          window.dispatchEvent(new CustomEvent('messenger:unread_updated'));
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      if (err.response?.status === 403 || err.response?.data?.message?.includes('Access denied')) {
        setActiveConv(null);
      }
    } finally {
      if (showLoader) setLoadingMsgs(false);
    }
  };

  // Centralized scroll helper
  const scrollToLatest = useCallback(({ behavior = 'smooth' } = {}) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    setIsAtBottom(true);
    setShowNewMessages(false);
  }, []);

  // Passive scroll position listener for threshold detection
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom <= 150;

    setIsAtBottom(isNearBottom);
    if (isNearBottom) {
      setShowNewMessages(false);
    }
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const handleSelectConv = (conv) => {
    hasInitialScrolledRef.current = false;
    setIsAtBottom(true);
    setShowNewMessages(false);
    setActiveConv(conv);
    setMobileShowChat(true);
    setShowMoreMenu(false);
    setShowChatSearch(false);
    fetchMessages(conv.id, true);
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    window.dispatchEvent(new CustomEvent('messenger:unread_updated'));
  };

  // Controlled message scroll effect
  useEffect(() => {
    if (!activeConv) {
      prevMessagesRef.current = [];
      prevConvIdRef.current = null;
      return;
    }

    const convChanged = prevConvIdRef.current !== activeConv.id;
    if (convChanged) {
      prevConvIdRef.current = activeConv.id;
      hasInitialScrolledRef.current = false;
      setIsAtBottom(true);
      setShowNewMessages(false);
      prevMessagesRef.current = messages;
      return;
    }

    // Initial load scroll for the conversation
    if (!hasInitialScrolledRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        scrollToLatest({ behavior: 'auto' });
        hasInitialScrolledRef.current = true;
      });
      prevMessagesRef.current = messages;
      return;
    }

    const prevMsgs = prevMessagesRef.current;
    prevMessagesRef.current = messages;

    if (!prevMsgs || prevMsgs.length === 0) return;

    // Detect if a new message was appended to the bottom of the list
    const lastOldMsg = prevMsgs[prevMsgs.length - 1];
    const lastNewMsg = messages[messages.length - 1];

    const isNewMessageAppended = 
      messages.length > prevMsgs.length &&
      lastNewMsg &&
      (!lastOldMsg || (lastNewMsg.id !== lastOldMsg.id && String(lastNewMsg.id).replace('temp-', '') !== String(lastOldMsg.id).replace('temp-', '')));

    if (isNewMessageAppended) {
      const isSentByMe = isUserSentMessageRef.current || String(lastNewMsg.sender_id || '').toLowerCase() === String(user?.id || '').toLowerCase();
      isUserSentMessageRef.current = false;

      if (isSentByMe) {
        requestAnimationFrame(() => {
          scrollToLatest({ behavior: 'smooth' });
        });
      } else {
        if (isAtBottom) {
          requestAnimationFrame(() => {
            scrollToLatest({ behavior: 'smooth' });
          });
        } else {
          setShowNewMessages(true);
        }
      }
    }
  }, [messages, activeConv, isAtBottom, scrollToLatest, user?.id]);


  // 3. Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!activeConv) return;
    if (!inputText.trim() && attachments.length === 0) return;

    setSending(true);

    // Upload local file attachments to backend/S3 first
    let processedAttachments = [];
    const pendingBlobUrls = [];
    try {
      if (attachments.length > 0) {
        for (const att of attachments) {
          if (att.file_blob || (att.file_url && att.file_url.startsWith('blob:'))) {
            if (att.file_url && att.file_url.startsWith('blob:')) {
              pendingBlobUrls.push(att.file_url);
            }
            if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
              pendingBlobUrls.push(att.previewUrl);
            }
            const formData = new FormData();
            formData.append('file', att.file_blob || att.file);
            const uploadRes = await api.post('/messenger/attachments/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (uploadRes.data?.success && uploadRes.data.data) {
              const up = uploadRes.data.data;
              processedAttachments.push({
                file_name: up.file_name || att.file_name,
                file_type: up.file_type || att.file_type,
                file_size: up.file_size || att.file_size,
                file_url: up.file_url,
                storage_key: up.storage_key
              });
            } else {
              throw new Error('Failed to upload file attachment');
            }
          } else {
            processedAttachments.push(att);
          }
        }
      }
    } catch (uploadErr) {
      console.error('Attachment upload failed:', uploadErr);
      alert(uploadErr.response?.data?.message || uploadErr.message || 'Failed to upload attachment file.');
      setSending(false);
      return;
    }

    const payload = {
      conversation_id: activeConv.id,
      message_text: inputText.trim(),
      message_type: processedAttachments.length > 0 ? 'FILE' : 'TEXT',
      attachments: processedAttachments
    };

    const nowIso = new Date().toISOString();
    const msgSnippet = inputText.trim() || (processedAttachments.length > 0 ? `📷 [${processedAttachments.length} File Attachment]` : '');

    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id,
      sender_name: user?.full_name || 'You',
      message_text: inputText.trim(),
      message_type: processedAttachments.length > 0 ? 'FILE' : 'TEXT',
      attachments: processedAttachments,
      created_at: nowIso,
      reads: []
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setAttachments([]);
    setShowEmojiPicker(false);

    // Schedule safe delayed revocation of temporary blob URLs after 15 seconds
    if (pendingBlobUrls.length > 0) {
      setTimeout(() => {
        pendingBlobUrls.forEach(url => revokeTrackedBlobUrl(url));
      }, 15000);
    }

    // Optimistically update conversation snippet & move to top of conversation list!
    setConversations(prev => {
      const updatedList = prev.map(c => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            last_message_text: msgSnippet,
            last_message_at: nowIso,
            updated_at: nowIso
          };
        }
        return c;
      });
      return sortConversationsList(updatedList);
    });

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

  const handleClearChat = async () => {
    if (!activeConv) return;
    const titleName = getConvTitle(activeConv);
    const isGroup = activeConv.conversation_type === 'GROUP';
    const confirmMsg = isGroup 
      ? `Are you sure you want to delete chat history for "${titleName}"? The group will remain in your messages list.`
      : `Are you sure you want to delete chat history for "${titleName}"?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      const res = await api.post(`/messenger/conversations/${activeConv.id}/clear`);
      if (res.data?.success) {
        setMessages([]);
        setShowMoreMenu(false);
        fetchConversations(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear chat.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeConv) return;
    const titleName = getConvTitle(activeConv);
    if (!window.confirm(`Are you sure you want to leave group "${titleName}"? You will be disconnected from this group and it will be removed from your messages list.`)) {
      return;
    }
    try {
      const res = await api.post(`/messenger/conversations/${activeConv.id}/leave`);
      if (res.data?.success) {
        setActiveConv(null);
        setMessages([]);
        setShowMoreMenu(false);
        fetchConversations(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave group.');
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    const titleName = getConvTitle(activeConv);
    if (!window.confirm(`Are you sure you want to delete chat with "${titleName}"? It will be removed from your messages list.`)) {
      return;
    }
    try {
      const res = await api.delete(`/messenger/conversations/${activeConv.id}`);
      if (res.data?.success) {
        setActiveConv(null);
        setMessages([]);
        setShowMoreMenu(false);
        fetchConversations(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete chat.');
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
      return { text: 'Online', isOnline: true };
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
    const targetUser = conv.other_participants?.find(p => (p.user_id || p.id) !== user?.id) || 
                       conv.participants?.find(p => (p.user_id || p.id) !== user?.id) || 
                       conv.other_participants?.[0];
    return getUserStatusText(targetUser);
  };

  const getConvTitle = (conv) => {
    if (!conv) return 'Chat';

    // For DIRECT conversations, ALWAYS resolve the counterpart / target participant's name!
    if (conv.conversation_type === 'DIRECT') {
      const otherP = conv.other_participants?.find(p => (p.user_id || p.id) !== user?.id) || 
                     conv.participants?.find(p => (p.user_id || p.id) !== user?.id) ||
                     (conv.other_participants?.[0] && (conv.other_participants[0].user_id || conv.other_participants[0].id) !== user?.id ? conv.other_participants[0] : null);
      if (otherP) {
        if (isSuperAdminOrSharad) {
          return (otherP.full_name && otherP.full_name !== 'User Profile')
            ? otherP.full_name
            : (otherP.name || (otherP.first_name ? `${otherP.first_name} ${otherP.last_name || ''}`.trim() : '') || otherP.email || 'Direct Chat');
        } else {
          const code = otherP.partner_code || otherP.employee_code || (otherP.user_id || otherP.id ? `USR-${(otherP.user_id || otherP.id).slice(0, 6).toUpperCase()}` : '');
          return code || 'Direct Chat';
        }
      }

      if (conv.name && conv.name.trim().toLowerCase() !== (user?.full_name || '').trim().toLowerCase()) {
        return conv.name;
      }
      return 'Direct Chat';
    }

    if (conv.name) {
      return conv.name;
    }

    if (conv.other_participants && conv.other_participants.length > 0) {
      const others = conv.other_participants.filter(p => (p.user_id || p.id) !== user?.id);
      if (others.length > 0) {
        return others.map(p => {
          if (!isSuperAdminOrSharad) {
            const code = p.partner_code || p.employee_code || `USR-${(p.user_id || p.id || '').slice(0, 6).toUpperCase()}`;
            return code || 'Member';
          }
          return p.full_name;
        }).join(', ');
      }
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
      height: isMobile ? 'calc(100dvh - 125px)' : 'calc(100vh - 90px)',
      maxHeight: isMobile ? 'calc(100dvh - 125px)' : 'none',
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

            {/* Super Admin Access Mode Toggle Header */}
            {(user?.role || '').toUpperCase() === 'SUPER_ADMIN' && !readOnly && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', background: '#F8FAFC', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  style={{
                    flex: 1, padding: '7px 10px', borderRadius: '8px', border: 'none',
                    background: !showAssignModal ? '#2563EB' : 'transparent',
                    color: !showAssignModal ? '#FFFFFF' : '#475569',
                    fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  View Messenger
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(true); fetchAccountsAndAssignments(); }}
                  style={{
                    flex: 1, padding: '7px 10px', borderRadius: '8px', border: 'none',
                    background: showAssignModal ? '#2563EB' : 'transparent',
                    color: showAssignModal ? '#FFFFFF' : '#475569',
                    fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  Assign Messenger
                </button>
              </div>
            )}

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
                { id: 'ALL', label: `All ${conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) ? `(${conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)})` : ''}`.trim() },
                { id: 'EMPLOYEES', label: 'Employees' },
                { id: 'PARTNERS', label: 'Partners' },
                { id: 'GROUPS', label: 'Groups' },
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
            ) : conversations.filter(conv => {
              if (filter === 'EMPLOYEES') {
                const targetUser = conv.other_participants?.find(p => (p.user_id || p.id) !== user?.id) || conv.other_participants?.[0];
                const role = (targetUser?.role || targetUser?.participant_role || '').toUpperCase();
                return role === 'EMPLOYEE' || role === 'ADMIN' || role === 'SUPER_ADMIN' || !!targetUser?.employee_code || conv.conversation_type === 'GROUP';
              }
              if (filter === 'PARTNERS') {
                const targetUser = conv.other_participants?.find(p => (p.user_id || p.id) !== user?.id) || conv.other_participants?.[0];
                const role = (targetUser?.role || targetUser?.participant_role || '').toUpperCase();
                return role === 'PARTNER' || role === 'CHANNEL_PARTNER' || !!targetUser?.partner_code;
              }
              if (filter === 'GROUPS') return conv.conversation_type === 'GROUP';
              if (filter === 'UNREAD') return conv.unread_count > 0;
              return true;
            }).length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#475569' }}>No conversations found</p>
                <span>Click + above to start a chat with your team</span>
              </div>
            ) : (
              conversations.filter(conv => {
                if (filter === 'EMPLOYEES') {
                  const targetUser = conv.other_participants?.find(p => (p.user_id || p.id) !== user?.id) || conv.other_participants?.[0];
                  const role = (targetUser?.role || targetUser?.participant_role || '').toUpperCase();
                  return role === 'EMPLOYEE' || role === 'ADMIN' || role === 'SUPER_ADMIN' || !!targetUser?.employee_code || conv.conversation_type === 'GROUP';
                }
                if (filter === 'PARTNERS') {
                  const targetUser = conv.other_participants?.find(p => (p.user_id || p.id) !== user?.id) || conv.other_participants?.[0];
                  const role = (targetUser?.role || targetUser?.participant_role || '').toUpperCase();
                  return role === 'PARTNER' || role === 'CHANNEL_PARTNER' || !!targetUser?.partner_code;
                }
                if (filter === 'GROUPS') return conv.conversation_type === 'GROUP';
                if (filter === 'UNREAD') return conv.unread_count > 0;
                return true;
              }).map(conv => {
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
                  onClick={() => {
                    if (activeConv.conversation_type === 'GROUP') {
                      openGroupMembersModal(activeConv);
                    } else {
                      openUserProfile(activeConv.other_participants?.[0] || { full_name: getConvTitle(activeConv) });
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px', cursor: 'pointer', minWidth: 0 }}
                  title={activeConv.conversation_type === 'GROUP' ? "Click to view Group Members" : "Click to view User Profile"}
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
                    <h3 style={{ margin: 0, fontSize: isMobile ? '14px' : '15.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '120px' : '220px' }}>
                      {getConvTitle(activeConv)}
                      {activeConv.is_pinned && <FaThumbtack size={10} color="#2563EB" title="Pinned Chat" />}
                      {activeConv.conversation_type === 'GROUP' && isSuperAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditGroupName();
                          }}
                          title="Edit Group Name (Super Admin Only)"
                          style={{ background: 'transparent', border: 'none', color: '#2563EB', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        >
                          <FaEdit size={13} />
                        </button>
                      )}
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
                        onClick={() => handleInitiateCall('voice')}
                        title="Voice Call"
                        style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px' }}
                      >
                        <FaPhone size={15} />
                      </button>
                      <button
                        onClick={() => handleInitiateCall('video')}
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
                        onClick={() => {
                          if (activeConv.conversation_type === 'GROUP') {
                            openGroupMembersModal(activeConv);
                          } else {
                            openUserProfile(activeConv.other_participants?.[0] || { full_name: getConvTitle(activeConv) });
                          }
                          setShowMoreMenu(false);
                        }}
                        style={{ padding: '10px 16px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        {activeConv.conversation_type === 'GROUP' ? <FaUsers size={14} color="#2563EB" /> : <FaUserCircle size={14} color="#2563EB" />}
                        <span>{activeConv.conversation_type === 'GROUP' ? 'Group Members & Info' : 'View User Profile'}</span>
                      </div>
                      {isMobile && (
                        <>
                          <div
                            onClick={() => { handleInitiateCall('voice'); setShowMoreMenu(false); }}
                            style={{ padding: '10px 16px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          >
                            <FaPhone size={13} color="#2563EB" />
                            <span>Voice Call</span>
                          </div>
                          <div
                            onClick={() => { handleInitiateCall('video'); setShowMoreMenu(false); }}
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
                      {activeConv.conversation_type === 'GROUP' ? (
                        <>
                          {isSuperAdmin && (
                            <div
                              onClick={() => {
                                handleOpenEditGroupName();
                                setShowMoreMenu(false);
                              }}
                              style={{ padding: '10px 16px', fontSize: '13px', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}
                            >
                              <FaEdit size={13} color="#2563EB" />
                              <span>Edit Group Name</span>
                            </div>
                          )}
                          <div
                            onClick={handleClearChat}
                            style={{ padding: '10px 16px', fontSize: '13px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #F1F5F9' }}
                          >
                            <FaTrashAlt size={12} color="#DC2626" />
                            <span style={{ fontWeight: 600 }}>Delete Chat</span>
                          </div>
                          <div
                            onClick={handleLeaveGroup}
                            style={{ padding: '10px 16px', fontSize: '13px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          >
                            <FaSignOutAlt size={12} color="#DC2626" />
                            <span style={{ fontWeight: 600 }}>Leave Group</span>
                          </div>
                        </>
                      ) : (
                        <div
                          onClick={handleDeleteConversation}
                          style={{ padding: '10px 16px', fontSize: '13px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #F1F5F9' }}
                        >
                          <FaTrashAlt size={12} color="#DC2626" />
                          <span style={{ fontWeight: 600 }}>Delete Chat</span>
                        </div>
                      )}
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
              <div 
                ref={messagesContainerRef}
                onClick={() => setActiveReactionPickerMsgId(null)}
                style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 12px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
              >
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
                  <>
                    {/* Floating Auto-Delete Banner */}
                    <div style={{
                      margin: '0 auto 10px auto',
                      padding: '8px 16px',
                      borderRadius: '24px',
                      background: '#FEF2F2',
                      border: '1px solid #FEE2E2',
                      color: '#DC2626',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      boxShadow: '0 2px 6px rgba(220,38,38,0.06)',
                      maxWidth: '92%',
                      width: 'fit-content'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaLock size={12} color="#DC2626" />
                        <span>Messages & attachments automatically delete everywhere after 48 hours</span>
                      </div>
                    </div>

                    {/* Centered Date Separator Bubble */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 10px 0' }}>
                      <span style={{
                        padding: '5px 16px', borderRadius: '20px', background: '#E0F2FE',
                        color: '#0369A1', fontSize: '11.5px', fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}>
                        Today
                      </span>
                    </div>

                    {filteredMessages.map((msg, msgIdx) => {
                      if (msg.message_type === 'SYSTEM') {
                        const sysTxt = (msg.message_text || '').toLowerCase();
                        if (sysTxt.includes('added') || sysTxt.includes('removed') || sysTxt.includes('left') || sysTxt.includes('joined')) {
                          return null;
                        }
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                            <span style={{
                              padding: '5px 14px', borderRadius: '16px', background: '#F1F5F9', border: '1px solid #CBD5E1',
                              color: '#475569', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                              {msg.message_text}
                            </span>
                          </div>
                        );
                      }

                      const isMe = String(msg.sender_id || '').toLowerCase() === String(user?.id || '').toLowerCase();
                      const isReadByReceiver = Boolean(
                        msg.is_read ||
                        (Array.isArray(msg.reads) && msg.reads.some(r => r.user_id && String(r.user_id).toLowerCase() !== String(msg.sender_id).toLowerCase()))
                      );

                      const isEditingThis = editingMsgId === msg.id;
                      const isNearBottom = msgIdx >= filteredMessages.length - 4;
                      const isHovered = hoveredMsgId === msg.id;
                      const isPickerOpen = activeReactionPickerMsgId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          onMouseEnter={() => setHoveredMsgId(msg.id)}
                          onMouseLeave={() => setHoveredMsgId(null)}
                          style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            position: 'relative',
                            width: '100%'
                          }}
                        >
                          {!isMe && (
                            <span 
                              onClick={() => {
                                if (isSuperAdmin) {
                                  openUserProfile(msg);
                                }
                              }}
                              title={isSuperAdmin ? "Click to view profile details" : "Member"}
                              style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', marginBottom: '3px', marginLeft: '4px', cursor: isSuperAdmin ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FaUserCircle size={11} /> {
                                (activeConv?.conversation_type === 'GROUP' || activeConv?.conversation_type === 'DEPARTMENT')
                                  ? (isSuperAdmin
                                      ? (msg.sender_name || 'Member')
                                      : (() => {
                                          const memberIdx = groupMembers.findIndex(gm => 
                                            String(gm.user_id || gm.id).toLowerCase() === String(msg.sender_id || msg.user_id).toLowerCase()
                                          );
                                          return memberIdx !== -1 ? `User ${memberIdx + 1}` : 'User';
                                        })())
                                  : (isSuperAdminOrSharad
                                      ? (msg.sender_name || 'Member')
                                      : (msg.sender_partner_code || msg.sender_employee_code || 'Member'))
                              }
                            </span>
                          )}

                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            flexDirection: isMe ? 'row-reverse' : 'row',
                            maxWidth: '100%', position: 'relative'
                          }}>
                            {/* Message Bubble Container */}
                            <div style={{
                              maxWidth: isMobile ? '85%' : '65%', padding: isMobile ? '10px 14px' : '12px 18px',
                              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              background: isMe ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#FFFFFF',
                              border: isMe ? 'none' : '1px solid #E2E8F0',
                              color: isMe ? '#FFFFFF' : '#0F172A',
                              boxShadow: isMe ? '0 4px 12px rgba(37,99,235,0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                              fontSize: isMobile ? '13.5px' : '14px', lineHeight: 1.5,
                              position: 'relative'
                            }}>
                              {isEditingThis ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #2563EB', outline: 'none', fontSize: '13px' }}
                                    autoFocus
                                  />
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setEditingMsgId(null)} style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={() => handleEditMessage(msg.id)} style={{ padding: '3px 10px', borderRadius: '6px', border: 'none', background: '#2563EB', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Save</button>
                                  </div>
                                </div>
                              ) : (
                                msg.message_text && (
                                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {msg.message_text}
                                    {msg.is_edited && <span style={{ fontSize: '10px', color: '#64748B', fontStyle: 'italic', marginLeft: '6px' }}>(edited)</span>}
                                  </div>
                                )
                              )}

                              {/* Render File & Image Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div style={{ marginTop: msg.message_text ? '10px' : 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {msg.attachments.map((att, idx) => {

                                    const norm = normalizeMessengerAttachment(att);
                                    if (!norm) return null;

                                    const displayUrl = getImageUrl(norm.fileUrl);
                                    const isFailed = failedImageUrls[displayUrl] || failedImageUrls[norm.fileUrl] || (norm.id && failedImageUrls[norm.id]);

                                    if (norm.isImg && !isFailed) {
                                      return (
                                        <div key={idx} style={{ position: 'relative', display: 'inline-block', maxWidth: '280px' }}>
                                          <AuthenticatedImage
                                            src={displayUrl}
                                            alt={norm.fileName}
                                            onError={() => {
                                              setFailedImageUrls(prev => ({ 
                                                ...prev, 
                                                [displayUrl]: true, 
                                                [norm.fileUrl]: true,
                                                ...(norm.id ? { [norm.id]: true } : {})
                                              }));
                                            }}
                                            onClick={() => openPreviewModal(displayUrl)}
                                            style={{
                                              maxWidth: '100%',
                                              maxHeight: '220px',
                                              borderRadius: '12px',
                                              objectFit: 'cover',
                                              border: '1px solid #CBD5E1',
                                              cursor: 'pointer',
                                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                            }}
                                          />
                                          {displayUrl && (
                                            <div style={{
                                              position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 5
                                            }}>
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleCopyImage(displayUrl); }}
                                                style={{
                                                  background: 'rgba(15,23,42,0.75)', color: '#FFFFFF',
                                                  borderRadius: '50%', width: '28px', height: '28px', border: 'none',
                                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                  backdropFilter: 'blur(4px)', cursor: 'pointer'
                                                }}
                                                title="Copy Image to Clipboard"
                                              >
                                                <FaCopy size={11} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDownloadImage(displayUrl, norm.fileName); }}
                                                style={{
                                                  background: 'rgba(15,23,42,0.75)', color: '#FFFFFF',
                                                  borderRadius: '50%', width: '28px', height: '28px', border: 'none',
                                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                  backdropFilter: 'blur(4px)', cursor: 'pointer'
                                                }}
                                                title="Download Image"
                                              >
                                                <FaDownload size={11} />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        style={{
                                          padding: '10px 14px', background: '#FFFFFF', borderRadius: '12px',
                                          border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', gap: '12px'
                                        }}
                                      >
                                        <div style={{
                                          width: '36px', height: '36px', borderRadius: '8px',
                                          background: norm.isImg ? '#FEF2F2' : '#FEE2E2',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          color: norm.isImg ? '#DC2626' : '#EF4444'
                                        }}>
                                          {norm.isImg ? <FaImage size={18} /> : <FaFilePdf size={18} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {norm.fileName}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                                            {isFailed ? 'Image unavailable' : norm.fileSize || 'Document'}
                                          </div>
                                        </div>
                                        {!isFailed && displayUrl && (
                                          <a href={displayUrl} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>
                                            <FaDownload size={14} />
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Applied Emoji Reaction Badge */}
                              {reactionsMap[msg.id] && (
                                <div
                                  onClick={() => handleToggleReaction(msg.id, reactionsMap[msg.id])}
                                  style={{
                                    position: 'absolute', bottom: '-10px', [isMe ? 'left' : 'right']: '12px',
                                    background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '14px',
                                    padding: '1px 6px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                    cursor: 'pointer', zIndex: 15, display: 'inline-flex', alignItems: 'center'
                                  }}
                                  title="Click to remove reaction"
                                >
                                  {reactionsMap[msg.id]}
                                </div>
                              )}

                              {/* Clean Timestamp & Ticks (No inline copy/edit/delete buttons) */}
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                gap: '4px', marginTop: '4px', fontSize: '10.5px', color: isMe ? 'rgba(255, 255, 255, 0.85)' : '#94A3B8'
                              }}>
                                <span>{formatTime(msg.created_at)}</span>
                                {isMe && (
                                  <FaCheckDouble
                                    color={isReadByReceiver ? '#93C5FD' : 'rgba(255, 255, 255, 0.7)'}
                                    size={13}
                                    title={isReadByReceiver ? 'Read by recipient' : 'Sent'}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Hover Smile Emoji Trigger Button */}
                            {!readOnly && (isHovered || isPickerOpen) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveReactionPickerMsgId(prev => prev === msg.id ? null : msg.id);
                                }}
                                style={{
                                  background: '#FFFFFF', border: '1px solid #CBD5E1',
                                  color: isPickerOpen ? '#2563EB' : '#64748B',
                                  cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.15s ease',
                                  flexShrink: 0
                                }}
                                title="Emoji & Message Actions"
                              >
                                <FaSmile size={15} />
                              </button>
                            )}

                            {/* Popup Action & Reaction Menu (Boundary Aware) */}
                            {isPickerOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  ...(isNearBottom ? { bottom: '100%', marginBottom: '6px' } : { top: '100%', marginTop: '6px' }),
                                  ...(isMe ? { right: '0px' } : { left: '0px' }),
                                  background: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '16px',
                                  padding: '10px 14px',
                                  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                                  zIndex: 100,
                                  width: '285px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                {/* Top Section: Emoji Reaction Row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px', padding: '0 2px' }}>
                                  {REACTION_EMOJIS.map(emoji => (
                                    <span
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      style={{
                                        fontSize: '18px', cursor: 'pointer', transition: 'transform 0.1s',
                                        padding: '2px 4px', borderRadius: '6px', display: 'inline-flex',
                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                      title={`React with ${emoji}`}
                                    >
                                      {emoji}
                                    </span>
                                  ))}
                                </div>

                                {/* Divider Line */}
                                <div style={{ height: '1px', background: '#E2E8F0', margin: '2px 0' }} />

                                {/* Bottom Section: Vertical List of Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {/* Copy Message Action */}
                                  {msg.message_text && (
                                    <div
                                      onClick={() => {
                                        handleCopyMessageText(msg.message_text, msg.id);
                                        setActiveReactionPickerMsgId(null);
                                      }}
                                      style={{
                                        padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                        color: '#1E293B', fontWeight: 600, transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <FaCopy size={13} color="#2563EB" />
                                      <span>{copiedMsgId === msg.id ? 'Copied!' : 'Copy Message'}</span>
                                    </div>
                                  )}

                                  {/* Edit Message Action (Sender Text Message) */}
                                  {isMe && msg.message_text && !readOnly && (
                                    <div
                                      onClick={() => {
                                        setEditingMsgId(msg.id);
                                        setEditingText(msg.message_text || '');
                                        setActiveReactionPickerMsgId(null);
                                      }}
                                      style={{
                                        padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                        color: '#1E293B', fontWeight: 600, transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <FaEdit size={13} color="#2563EB" />
                                      <span>Edit Message</span>
                                    </div>
                                  )}

                                  {/* Delete Message Action (Sender only) */}
                                  {isMe && (
                                    <div
                                      onClick={() => {
                                        setActiveReactionPickerMsgId(null);
                                        handleDeleteSingleMessage(msg.id);
                                      }}
                                      style={{
                                        padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                        color: '#DC2626', fontWeight: 600, transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <FaTrashAlt size={13} color="#DC2626" />
                                      <span>Delete Message</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}</>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating New Messages Indicator Pill Button */}
              {showNewMessages && (
                <div style={{
                  position: 'absolute',
                  bottom: attachments.length > 0 ? (isMobile ? '110px' : '125px') : (isMobile ? '65px' : '80px'),
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 30
                }}>
                  <button
                    type="button"
                    onClick={() => scrollToLatest({ behavior: 'smooth' })}
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      borderRadius: '999px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.22)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>↓ New messages</span>
                  </button>
                </div>
              )}

              {/* Pending Attachments Chip Bar */}
              {attachments.length > 0 && (
                <div style={{ padding: '8px 16px', background: '#EFF6FF', borderTop: '1px solid #BFDBFE', display: 'flex', gap: '8px', overflowX: 'auto', alignItems: 'center' }}>
                  {attachments.map((att, idx) => (
                    <div key={idx} style={{ padding: '4px 10px', background: '#FFFFFF', border: '1px solid #93C5FD', borderRadius: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
                      {att.file_type === 'IMAGE' && att.file_url ? (
                        <img src={att.file_url} alt="thumb" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <FaFileAlt size={14} color="#2563EB" />
                      )}
                      <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{att.file_name}</span>
                      <FaTimes size={12} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => removeAttachment(idx)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Comprehensive Emoji Picker Popup Overlay with 0-9 Digits */}
              {showEmojiPicker && (
                <div style={{
                  position: 'absolute', bottom: isMobile ? '60px' : '75px', left: isMobile ? '10px' : '24px',
                  width: isMobile ? 'calc(100% - 20px)' : '340px',
                  background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '16px', padding: '12px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  {/* Emoji Picker Header with Close Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A' }}>Select Emojis</span>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '14px', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Category Tabs */}
                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid #F1F5F9' }}>
                    {EMOJI_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setActiveEmojiTab(cat.id); setEmojiSearch(''); }}
                        style={{
                          padding: '4px 10px', borderRadius: '12px', border: 'none',
                          background: activeEmojiTab === cat.id ? '#2563EB' : '#F1F5F9',
                          color: activeEmojiTab === cat.id ? '#FFFFFF' : '#475569',
                          fontSize: '11px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Emoji Search Box */}
                  <input
                    type="text"
                    placeholder="Search emojis or 0-9 digits..."
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    style={{
                      padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0',
                      fontSize: '12px', outline: 'none', background: '#F8FAFC'
                    }}
                  />

                  {/* Emoji Grid */}
                  <div style={{
                    maxHeight: '180px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px'
                  }}>
                    {(() => {
                      let displayList = [];
                      if (emojiSearch.trim()) {
                        const q = emojiSearch.trim().toLowerCase();
                        EMOJI_CATEGORIES.forEach(c => {
                          c.emojis.forEach(e => {
                            if (e.includes(q) || c.name.toLowerCase().includes(q)) displayList.push(e);
                          });
                        });
                      } else {
                        const currentCat = EMOJI_CATEGORIES.find(c => c.id === activeEmojiTab) || EMOJI_CATEGORIES[0];
                        displayList = currentCat.emojis;
                      }

                      return displayList.map((emoji, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setInputText(prev => prev + emoji); }}
                          style={{
                            background: 'transparent', border: 'none', fontSize: '20px',
                            cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'transform 0.1s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {emoji}
                        </button>
                      ));
                    })()}
                  </div>
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
                  onPaste={handlePaste}
                  style={{
                    padding: isMobile ? '10px 12px 16px' : '14px 20px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    style={{ background: 'transparent', border: 'none', color: showEmojiPicker ? '#2563EB' : '#64748B', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
                    title="Emoji"
                  >
                    <FaSmile />
                  </button>

                  {/* Document Attachment Input */}
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
                    style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
                    title="Attach File / Document"
                  >
                    <FaPaperclip />
                  </button>

                  <textarea
                    rows={1}
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    style={{
                      flex: 1, padding: '10px 18px', background: '#F8FAFC',
                      border: '1px solid #E2E8F0', borderRadius: '24px',
                      color: '#0F172A', fontSize: '14px', outline: 'none',
                      resize: 'none', fontFamily: 'inherit', maxHeight: '100px', lineHeight: 1.4,
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  />

                  {/* Image Attachment Input */}
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
                    title="Upload Image"
                  >
                    <FaImage />
                  </button>

                  {/* Voice Note Button */}
                  <button
                    type="button"
                    onClick={() => alert('Voice message feature active. Speak now...')}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '19px', cursor: 'pointer', padding: '4px' }}
                    title="Voice Message"
                  >
                    <FaMicrophone />
                  </button>

                  <button
                    type="submit"
                    disabled={sending || (!inputText.trim() && attachments.length === 0)}
                    style={{
                      width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                      flexShrink: 0, opacity: (sending || (!inputText.trim() && attachments.length === 0)) ? 0.6 : 1,
                      transition: 'all 0.15s'
                    }}
                  >
                    <FaPaperPlane size={15} />
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
              {contacts.map(c => {
                const codeVal = c.partner_code || c.employee_code || (c.id ? `USR-${c.id.slice(0, 6).toUpperCase()}` : '');
                const displayName = isSuperAdminOrSharad ? (c.full_name || 'User') : (codeVal || 'User');
                const subDetails = isSuperAdminOrSharad 
                  ? `${c.role || 'Member'} • ${c.email || c.mobile || 'N/A'}`
                  : `${c.role || 'Member'} • [Protected]`;
                return (
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
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>{displayName}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{subDetails}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 800 }}>Chat →</span>
                  </div>
                );
              })}
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
                const codeVal = c.partner_code || c.employee_code || (c.id ? `USR-${c.id.slice(0, 6).toUpperCase()}` : '');
                const displayName = isSuperAdminOrSharad ? (c.full_name || 'User') : (codeVal || 'User');
                const subDetails = isSuperAdminOrSharad ? (c.role || 'Member') : `${c.role || 'Member'} • [Protected]`;
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
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{displayName}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{subDetails}</div>
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

      {/* ── SUPER ADMIN ASSIGN MESSENGER MODAL ── */}
      {showAssignModal && (user?.role || '').toUpperCase() === 'SUPER_ADMIN' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '640px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', background: '#0F172A', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                  Assign Messenger
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94A3B8' }}>
                  Grant custom 2-layer Messenger access to accounts outside default rules
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFFFFF',
                  width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Select Account * */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  Select Account *
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #CBD5E1',
                    fontSize: '14px', color: '#0F172A', background: '#FFFFFF', fontWeight: 600, outline: 'none'
                  }}
                >
                  <option value="">-- Select Account --</option>
                  {accountsList.map(acc => {
                    const code = acc.partner_code || acc.employee_code || `USR-${acc.id.slice(0, 6).toUpperCase()}`;
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.full_name} ({code} - {(acc.role || '').toUpperCase()})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Select Messengers * */}
              {selectedAccountId && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                    Select Messengers *
                  </label>
                  <div style={{
                    maxHeight: '180px', overflowY: 'auto', border: '1.5px solid #CBD5E1',
                    borderRadius: '12px', padding: '10px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '6px'
                  }}>
                    {accountsList.filter(a => a.id !== selectedAccountId).map(targetAcc => {
                      const code = targetAcc.partner_code || targetAcc.employee_code || `USR-${targetAcc.id.slice(0, 6).toUpperCase()}`;
                      const isChecked = selectedMessengerIds.includes(targetAcc.id);
                      return (
                        <label
                          key={targetAcc.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                            borderRadius: '8px', background: isChecked ? '#EFF6FF' : '#FFFFFF',
                            border: `1px solid ${isChecked ? '#BFDBFE' : '#E2E8F0'}`, cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedMessengerIds(prev =>
                                prev.includes(targetAcc.id)
                                  ? prev.filter(id => id !== targetAcc.id)
                                  : [...prev, targetAcc.id]
                              );
                            }}
                          />
                          <div style={{ flex: 1, fontSize: '13px' }}>
                            <strong style={{ color: '#0F172A' }}>{targetAcc.full_name}</strong>
                            <span style={{ color: '#64748B', marginLeft: '6px', fontSize: '12px' }}>
                              ({code} - {targetAcc.role})
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Messengers Chips */}
              {selectedMessengerIds.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                    Selected Messengers ({selectedMessengerIds.length})
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedMessengerIds.map(id => {
                      const acc = accountsList.find(a => a.id === id);
                      const code = acc?.partner_code || acc?.employee_code || acc?.full_name || 'User';
                      return (
                        <span
                          key={id}
                          style={{
                            padding: '6px 12px', borderRadius: '20px', background: '#EFF6FF',
                            border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: '12.5px',
                            fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          {code}
                          <FaTimes
                            size={12}
                            style={{ cursor: 'pointer', color: '#1E40AF' }}
                            onClick={() => setSelectedMessengerIds(prev => prev.filter(item => item !== id))}
                          />
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Assignments Table */}
              <div>
                <h4 style={{ margin: '16px 0 8px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  Current Active Assignments
                </h4>
                {loadingAssignments ? (
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Loading assignments...</div>
                ) : existingAssignments.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', fontStyle: 'italic' }}>
                    No custom messenger assignments currently set.
                  </div>
                ) : (
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead style={{ background: '#F1F5F9', color: '#475569', fontWeight: 800 }}>
                        <tr>
                          <th style={{ padding: '8px 12px' }}>Account</th>
                          <th style={{ padding: '8px 12px' }}>Can Message</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingAssignments.map(a => {
                          const accCode = a.account_partner_code || a.account_employee_code || a.account_name;
                          const targetCode = a.messenger_partner_code || a.messenger_employee_code || a.messenger_name;
                          return (
                            <tr key={a.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>
                                {a.account_name} <span style={{ color: '#64748B', fontWeight: 500 }}>({accCode})</span>
                              </td>
                              <td style={{ padding: '8px 12px', color: '#2563EB', fontWeight: 700 }}>
                                {a.messenger_name} <span style={{ color: '#64748B', fontWeight: 500 }}>({targetCode})</span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAssignmentItem(a.id)}
                                  style={{
                                    padding: '3px 8px', borderRadius: '6px', background: '#FEF2F2',
                                    border: '1px solid #FCA5A5', color: '#DC2626', fontSize: '11px',
                                    fontWeight: 800, cursor: 'pointer'
                                  }}
                                >
                                  Unassign
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'flex-end', gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                style={{
                  padding: '10px 20px', borderRadius: '10px', background: '#F1F5F9',
                  color: '#475569', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '13.5px'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignMessengersSubmit}
                disabled={savingAssignment || !selectedAccountId || !selectedMessengerIds.length}
                style={{
                  padding: '10px 24px', borderRadius: '10px', background: '#2563EB',
                  color: '#FFFFFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13.5px',
                  opacity: (savingAssignment || !selectedAccountId || !selectedMessengerIds.length) ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                }}
              >
                {savingAssignment ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: GROUP MEMBERS & INFO ── */}
      {showGroupMembersModal && activeConv && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 99999, padding: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            width: isMobile ? '100%' : '480px', maxWidth: '500px', background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', maxHeight: '92vh', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
              padding: '24px', color: '#FFFFFF', position: 'relative', textAlign: 'center'
            }}>
              <button
                onClick={() => setShowGroupMembersModal(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)',
                  border: 'none', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                }}
              >
                ✕
              </button>

              <div style={{
                width: '68px', height: '68px', borderRadius: '50%', background: '#FFFFFF',
                color: '#2563EB', fontWeight: 900, display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)', border: '3px solid rgba(255,255,255,0.8)'
              }}>
                <FaUsers size={32} />
              </div>

              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {getConvTitle(activeConv)}
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setShowGroupMembersModal(false);
                      handleOpenEditGroupName();
                    }}
                    title="Edit Group Name (Super Admin Only)"
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFFFFF', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FaEdit size={13} />
                  </button>
                )}
              </h2>

              {activeConv.description && (
                <p style={{ margin: '0 0 8px', fontSize: '12.5px', color: '#DBEAFE', fontWeight: 500 }}>
                  {activeConv.description}
                </p>
              )}
              
              <span style={{
                display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 14px',
                borderRadius: '14px', fontSize: '12px', fontWeight: 700
              }}>
                👥 {groupMembers.length || '0'} Group Members
              </span>
            </div>

            {/* Action Bar & Content */}
            <div style={{ padding: '18px 24px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Add Member Toggle Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Group Members</h4>
                {!readOnly && isSuperAdminOrSharad && (
                  <button
                    onClick={handleOpenAddMemberSection}
                    style={{
                      padding: '6px 14px', borderRadius: '16px', background: showAddGroupMemberSection ? '#EFF6FF' : '#2563EB',
                      border: showAddGroupMemberSection ? '1px solid #BFDBFE' : 'none',
                      color: showAddGroupMemberSection ? '#2563EB' : '#FFFFFF',
                      fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <FaUserPlus size={13} /> {showAddGroupMemberSection ? 'Cancel Add' : 'Add Member'}
                  </button>
                )}
              </div>

              {/* Inline Add Member Panel */}
              {showAddGroupMemberSection && !readOnly && isSuperAdminOrSharad && (
                <div style={{
                  background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>Add New Members to Group</h5>
                  <input
                    type="text"
                    placeholder="Search team member name or role..."
                    value={addMemberSearch}
                    onChange={(e) => { setAddMemberSearch(e.target.value); fetchAddMemberContacts(e.target.value); }}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: '#FFFFFF',
                      border: '1px solid #CBD5E1', borderRadius: '10px', outline: 'none', fontSize: '13px'
                    }}
                  />

                  <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {addMemberContacts.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '10px' }}>
                        No available contacts to add
                      </div>
                    ) : (
                      addMemberContacts.map(c => {
                        const isChecked = selectedAddUserIds.includes(c.id);
                        const codeVal = c.partner_code || c.employee_code || (c.id ? `USR-${c.id.slice(0, 6).toUpperCase()}` : '');
                        const displayName = isSuperAdminOrSharad ? (c.full_name || 'User') : (codeVal || 'User');
                        const subDetails = isSuperAdminOrSharad
                          ? `${c.role || 'Member'} ${codeVal ? `(${codeVal})` : ''}`
                          : `${c.role || 'Member'} • [Protected]`;
                        return (
                          <label
                            key={c.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                              borderRadius: '10px', background: isChecked ? '#EFF6FF' : '#FFFFFF',
                              border: `1px solid ${isChecked ? '#BFDBFE' : '#E2E8F0'}`, cursor: 'pointer'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedAddUserIds(prev =>
                                  prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                );
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{displayName}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>{subDetails}</div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>

                  {selectedAddUserIds.length > 0 && (
                    <button
                      onClick={handleAddGroupMembersSubmit}
                      disabled={addingMembers}
                      style={{
                        padding: '10px', borderRadius: '10px', background: '#2563EB',
                        color: '#FFFFFF', fontWeight: 800, border: 'none', cursor: 'pointer',
                        fontSize: '13px', opacity: addingMembers ? 0.7 : 1
                      }}
                    >
                      {addingMembers ? 'Adding...' : `Add Selected (${selectedAddUserIds.length})`}
                    </button>
                  )}
                </div>
              )}

              {/* Member List */}
              {loadingGroupMembers ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px', fontSize: '13px' }}>
                  Loading group members...
                </div>
              ) : groupMembers.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px', fontSize: '13px' }}>
                  No active members in this group.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {groupMembers.map((m, idx) => {
                    const memberUserId = m.user_id || m.id;
                    const isMe = String(memberUserId).toLowerCase() === String(user?.id || '').toLowerCase();
                    const isAdmin = m.role === 'ADMIN' || m.participant_role === 'ADMIN';
                    const rawCode = m.partner_code || m.employee_code || (m.user_id ? `USR-${m.user_id.slice(0, 6).toUpperCase()}` : '');

                    const memberDisplayName = isSuperAdminOrSharad
                      ? (m.full_name || m.email || 'Group Member')
                      : `User ${idx + 1}`;

                    const avatarLetter = isSuperAdminOrSharad
                      ? (m.full_name || 'U').charAt(0).toUpperCase()
                      : `U${idx + 1}`;

                    const subtitleText = isSuperAdminOrSharad
                      ? `${m.role || 'Member'} ${rawCode ? `• ${rawCode}` : ''}`
                      : (m.role || 'Member');

                    return (
                      <div
                        key={memberUserId}
                        style={{
                          padding: '10px 14px', borderRadius: '14px', background: '#F8FAFC',
                          border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%', background: '#0EA5E9',
                            color: '#FFFFFF', fontWeight: 800, fontSize: isSuperAdminOrSharad ? '15px' : '13px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {avatarLetter}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {memberDisplayName}
                              </span>
                              {isMe && (
                                <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1E40AF', padding: '2px 6px', borderRadius: '8px', fontWeight: 800 }}>
                                  You
                                </span>
                              )}
                              {isAdmin && (
                                <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '8px', fontWeight: 800 }}>
                                  Admin
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {subtitleText}
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        {!readOnly && (
                          <div>
                            {isMe ? (
                              <button
                                onClick={handleLeaveGroup}
                                style={{
                                  padding: '4px 10px', borderRadius: '8px', background: '#FEF2F2',
                                  border: '1px solid #FCA5A5', color: '#DC2626', fontSize: '11px',
                                  fontWeight: 800, cursor: 'pointer'
                                }}
                              >
                                Leave
                              </button>
                            ) : isSuperAdminOrSharad ? (
                              <button
                                onClick={() => handleRemoveGroupMemberItem(memberUserId, m.full_name || 'Member')}
                                disabled={removingUserId === memberUserId}
                                style={{
                                  padding: '4px 10px', borderRadius: '8px', background: '#FEF2F2',
                                  border: '1px solid #FCA5A5', color: '#DC2626', fontSize: '11px',
                                  fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                  opacity: removingUserId === memberUserId ? 0.6 : 1
                                }}
                              >
                                <FaTrashAlt size={10} /> Remove
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT GROUP NAME (SUPER ADMIN ONLY) ── */}
      {showEditGroupNameModal && isSuperAdmin && activeConv && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 99999, padding: isMobile ? '16px' : '24px'
        }}>
          <form onSubmit={handleSaveGroupName} style={{
            width: isMobile ? '100%' : '400px', maxWidth: '420px', background: '#FFFFFF', borderRadius: '20px', padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaEdit color="#2563EB" size={16} /> Edit Group Name
              </h3>
              <button type="button" onClick={() => setShowEditGroupNameModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px' }}>✕</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                New Group Name *
              </label>
              <input
                type="text"
                value={editingGroupNameText}
                onChange={(e) => setEditingGroupNameText(e.target.value)}
                placeholder="Enter new group name..."
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: '#F8FAFC',
                  border: '1.5px solid #2563EB', borderRadius: '10px', outline: 'none', fontSize: '14px', fontWeight: 600
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowEditGroupNameModal(false)}
                style={{ padding: '8px 16px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingGroupName || !editingGroupNameText.trim()}
                style={{
                  padding: '8px 20px', borderRadius: '10px', background: '#2563EB', color: '#FFFFFF',
                  border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '13px',
                  opacity: (savingGroupName || !editingGroupNameText.trim()) ? 0.6 : 1
                }}
              >
                {savingGroupName ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: IMAGE PREVIEW LIGHTBOX ── */}
      {previewImageUrl && (
        <div 
          onClick={() => { setPreviewImageUrl(null); setZoomScale(1); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '24px'
          }}
        >
          <div style={{
            position: 'relative', maxWidth: '90vw', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Top Action Control Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '14px', background: 'rgba(30, 41, 59, 0.90)',
              padding: '8px 18px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
            }}>
              {!previewImgError && (
                <>
                  {/* Zoom Out Button */}
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                    style={{
                      background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: 'none',
                      borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    title="Zoom Out (-)"
                  >
                    <FaMinus size={12} />
                  </button>

                  {/* Zoom Scale Percentage Badge */}
                  <span style={{
                    color: '#60A5FA', fontSize: '12px', fontWeight: 800,
                    minWidth: '45px', textAlign: 'center'
                  }}>
                    {Math.round(zoomScale * 100)}%
                  </span>

                  {/* Zoom In Button */}
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(4, Number((prev + 0.25).toFixed(2))))}
                    style={{
                      background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: 'none',
                      borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    title="Zoom In (+)"
                  >
                    <FaPlus size={12} />
                  </button>

                  {/* Reset Zoom Button */}
                  {zoomScale !== 1 && (
                    <button
                      type="button"
                      onClick={() => setZoomScale(1)}
                      style={{
                        background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: 'none',
                        borderRadius: '16px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                      title="Reset Zoom to 100%"
                    >
                      <FaRedo size={10} /> Reset
                    </button>
                  )}

                  <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

                  {/* Download Image Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(previewImageUrl, 'chat_image.png')}
                    style={{
                      background: '#2563EB', color: '#FFFFFF', border: 'none',
                      borderRadius: '16px', padding: '6px 14px', display: 'flex',
                      alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800,
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
                    }}
                    title="Download Image to Device"
                  >
                    <FaDownload size={13} /> Download
                  </button>

                  {/* Copy Image Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyImage(previewImageUrl)}
                    style={{
                      background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '16px', padding: '6px 14px', display: 'flex',
                      alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Copy Image to Clipboard"
                  >
                    <FaCopy size={13} /> Copy Image
                  </button>
                </>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => { setPreviewImageUrl(null); setZoomScale(1); }}
                style={{
                  background: '#EF4444', color: '#FFFFFF', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  fontWeight: 900, marginLeft: '6px'
                }}
                title="Close Preview"
              >
                ✕
              </button>
            </div>

            {/* Image Preview Container with Zoom Transform & Authenticated Blob Loading */}
            <div 
              onWheel={(e) => {
                if (e.deltaY < 0) {
                  setZoomScale(prev => Math.min(4, Number((prev + 0.15).toFixed(2))));
                } else {
                  setZoomScale(prev => Math.max(0.5, Number((prev - 0.15).toFixed(2))));
                }
              }}
              style={{
                overflow: 'auto', maxWidth: '88vw', maxHeight: '80vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px'
              }}
            >
              {previewImgError ? (
                <div style={{
                  padding: '40px 50px', background: '#1E293B', borderRadius: '16px',
                  color: '#94A3B8', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
                    Image Preview Unavailable
                  </div>
                  <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                    The requested image link or local browser preview session has expired.
                  </div>
                </div>
              ) : (
                <AuthenticatedImage
                  src={previewImageUrl}
                  alt="Full Preview"
                  onError={() => setPreviewImgError(true)}
                  style={{
                    maxWidth: '85vw', maxHeight: '75vh', borderRadius: '16px', objectFit: 'contain',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.2)',
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REAL-TIME WEBRTC CALL OVERLAY ── */}
      {activeCall && (
        <MessengerCallModal
          activeCall={activeCall}
          onCloseCall={() => setActiveCall(null)}
        />
      )}

    </div>
  );
}
