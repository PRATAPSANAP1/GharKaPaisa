import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Icon } from '../../components/Icon';
import { Card } from '../../components/Card';
import {
  getConversations,
  getContacts,
  startDirectChat,
  getMessages,
  sendMessage,
  sendMessageWithAttachment,
  markRead,
  togglePinConversation,
  maskSensitiveData,
  MessengerConversation,
  MessengerContact,
  MessengerMessage,
} from '../../services/messenger.service';

import { AppState } from 'react-native';
import { getMessengerSocket } from '../../services/messengerSocket';

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'DIRECT', label: 'Direct' },
  { key: 'GROUP', label: 'Groups' },
  { key: 'APPLICATION', label: 'Applications' },
];

export default function MessengerScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIRECT' | 'GROUP' | 'APPLICATION'>('ALL');
  const [conversations, setConversations] = useState<MessengerConversation[]>([]);
  const [activeConv, setActiveConv] = useState<MessengerConversation | null>(null);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // New Chat Modal State
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [contacts, setContacts] = useState<MessengerContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const activeConvRef = useRef<MessengerConversation | null>(null);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  const fetchConvs = useCallback(async () => {
    try {
      const data = await getConversations(activeTab, searchQuery);
      setConversations(data);
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setLoadingConvs(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchConvs();
  }, [fetchConvs]);

  // Socket event subscription
  useEffect(() => {
    let isMounted = true;

    const setupSocketListeners = async () => {
      const socket = await getMessengerSocket();
      if (!socket || !isMounted) return;

      const handleNewMessage = (data: { conversation_id: string; message: MessengerMessage }) => {
        if (!data || !data.conversation_id || !data.message) return;
        const { conversation_id, message } = data;

        // 1. If message belongs to active thread
        if (activeConvRef.current && activeConvRef.current.id === conversation_id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

          if (String(message.sender_id).toLowerCase() !== String(user?.id).toLowerCase()) {
            markRead(conversation_id).catch(() => {});
          }
        }

        // 2. Incrementally update conversation list
        setConversations((prevConvs) => {
          const targetIndex = prevConvs.findIndex((c) => c.id === conversation_id);
          const isCurrentActive = activeConvRef.current?.id === conversation_id;
          const isOtherSender = String(message.sender_id).toLowerCase() !== String(user?.id).toLowerCase();

          if (targetIndex !== -1) {
            const targetConv = { ...prevConvs[targetIndex] };
            targetConv.last_message = {
              id: message.id,
              message_text: message.message_text,
              message_type: message.message_type,
              created_at: message.created_at,
              sender_name: message.sender_name,
            };
            targetConv.updated_at = message.created_at;

            if (!isCurrentActive && isOtherSender) {
              targetConv.unread_count = (targetConv.unread_count || 0) + 1;
            }

            const updatedList = [...prevConvs];
            updatedList.splice(targetIndex, 1);
            return [targetConv, ...updatedList];
          } else {
            fetchConvs();
            return prevConvs;
          }
        });
      };

      const handleMessageRead = (data: { conversation_id: string; user_id: string }) => {
        if (!data || !data.conversation_id) return;
        if (String(data.user_id).toLowerCase() === String(user?.id).toLowerCase()) {
          setConversations((prevConvs) =>
            prevConvs.map((c) => (c.id === data.conversation_id ? { ...c, unread_count: 0 } : c))
          );
        }
      };

      const handleMessageEdited = (data: { conversation_id: string; message: MessengerMessage }) => {
        if (!data || !data.message) return;
        if (activeConvRef.current?.id === data.conversation_id) {
          setMessages((prev) =>
            prev.map((m) => (m.id === data.message.id ? { ...m, ...data.message } : m))
          );
        }
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === data.conversation_id && c.last_message?.id === data.message.id) {
              return {
                ...c,
                last_message: {
                  ...c.last_message,
                  message_text: data.message.message_text,
                },
              };
            }
            return c;
          })
        );
      };

      const handleMessageDeleted = (data: { conversation_id: string; message_id: string }) => {
        if (!data || !data.message_id) return;
        if (activeConvRef.current?.id === data.conversation_id) {
          setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
        }
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === data.conversation_id && c.last_message?.id === data.message_id) {
              return {
                ...c,
                last_message: {
                  ...c.last_message,
                  message_text: 'Message deleted',
                },
              };
            }
            return c;
          })
        );
      };

      const handleTypingUpdate = (data: {
        conversation_id: string;
        user_id: string;
        user_name: string;
        is_typing: boolean;
      }) => {
        if (!data) return;
        if (
          activeConvRef.current?.id === data.conversation_id &&
          String(data.user_id).toLowerCase() !== String(user?.id).toLowerCase()
        ) {
          setTypingUser(data.is_typing ? data.user_name || 'Someone' : null);
        }
      };

      const handleReconnect = () => {
        fetchConvs();
        if (activeConvRef.current) {
          getMessages(activeConvRef.current.id)
            .then((msgs) => setMessages(msgs))
            .catch(() => {});
        }
      };

      socket.on('message:new', handleNewMessage);
      socket.on('message:read', handleMessageRead);
      socket.on('message:edited', handleMessageEdited);
      socket.on('message:deleted', handleMessageDeleted);
      socket.on('typing:update', handleTypingUpdate);
      socket.on('connect', handleReconnect);

      const appStateSub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          fetchConvs();
          if (!socket.connected) {
            socket.connect();
          }
        }
      });

      return () => {
        appStateSub.remove();
        socket.off('message:new', handleNewMessage);
        socket.off('message:read', handleMessageRead);
        socket.off('message:edited', handleMessageEdited);
        socket.off('message:deleted', handleMessageDeleted);
        socket.off('typing:update', handleTypingUpdate);
        socket.off('connect', handleReconnect);
      };
    };

    let cleanupFn: (() => void) | undefined;
    setupSocketListeners().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      isMounted = false;
      if (cleanupFn) cleanupFn();
    };
  }, [user?.id, fetchConvs]);

  const openConversation = async (conv: MessengerConversation) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    try {
      const msgs = await getMessages(conv.id);
      setMessages(msgs);
      await markRead(conv.id);
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || !activeConv || sending) return;
    const textToSend = inputText.trim();
    setInputText('');
    setSelectedImage(null);
    setSending(true);

    try {
      let sent;
      if (selectedImage) {
        sent = await sendMessageWithAttachment(activeConv.id, selectedImage, textToSend || undefined);
      } else {
        sent = await sendMessage({
          conversation_id: activeConv.id,
          message_text: textToSend,
          message_type: 'TEXT',
        });
      }
      if (sent) {
        setMessages((prev) => [...prev, sent]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.error('Failed to send message:', e);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePin = async (convId: string) => {
    try {
      const res = await togglePinConversation(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, is_pinned: res.is_pinned } : c))
      );
      if (activeConv?.id === convId) {
        setActiveConv((prev) => (prev ? { ...prev, is_pinned: res.is_pinned } : prev));
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not update pin status');
    }
  };

  const openNewChatModal = async () => {
    setNewChatModalVisible(true);
    setLoadingContacts(true);
    try {
      const list = await getContacts(contactSearch);
      setContacts(list);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSearchContacts = async (query: string) => {
    setContactSearch(query);
    try {
      const list = await getContacts(query);
      setContacts(list);
    } catch (err) {
      console.error('Error searching contacts:', err);
    }
  };

  const handleSelectContact = async (contact: MessengerContact) => {
    try {
      setStartingChat(true);
      const conv = await startDirectChat(contact.id);
      setNewChatModalVisible(false);
      setContactSearch('');
      await fetchConvs();
      if (conv) {
        openConversation(conv);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start chat with contact');
    } finally {
      setStartingChat(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConvs();
  };

  // Conversation Thread View
  if (activeConv) {
    const convName = activeConv.name || activeConv.other_user?.full_name || 'Conversation';
    const convRole = activeConv.other_user?.role || activeConv.conversation_type;

    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Thread Header */}
          <View style={styles.threadHeader}>
            <TouchableOpacity onPress={() => setActiveConv(null)} style={styles.backBtn}>
              <Icon name="chevron-left" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.threadAvatar}>
              <Text style={styles.threadAvatarText}>{(convName || 'C').charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.threadTitleContainer}>
              <Text style={styles.threadTitle} numberOfLines={1}>
                {convName}
              </Text>
              <Text style={styles.threadSubtitle}>
                {convRole} • Internal Channel
              </Text>
            </View>

            <TouchableOpacity onPress={() => handleTogglePin(activeConv.id)} style={styles.pinHeaderBtn}>
              <Icon
                name="bookmark"
                size={18}
                color={activeConv.is_pinned ? '#F59E0B' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>

          {/* Messages Stream */}
          {loadingMsgs ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingSubText}>Decrypting & loading chat history...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
                const isMe = String(item.sender_id).toLowerCase() === String(user?.id).toLowerCase();
                const hasAttachment = item.attachments && item.attachments.length > 0;
                const attachment = hasAttachment ? item.attachments[0] : null;
                const isImage = attachment && (attachment.file_type?.startsWith('image/') || attachment.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i));

                return (
                  <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                    <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                      {!isMe && item.sender_name && (
                        <Text style={styles.senderName}>{item.sender_name}</Text>
                      )}

                      {isImage && attachment?.file_url && (
                        <Image
                          source={{ uri: attachment.file_url }}
                          style={styles.attachmentImage}
                          resizeMode="cover"
                        />
                      )}

                      {item.message_text && (
                        <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                          {maskSensitiveData(item.message_text)}
                        </Text>
                      )}

                      <View style={styles.msgMetaRow}>
                        <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {isMe && (
                          <Icon name="check" size={12} color="#93C5FD" />
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Typing Indicator */}
          {typingUser && (
            <View style={styles.typingBox}>
              <Text style={styles.typingText}>{typingUser} is typing...</Text>
            </View>
          )}

          {/* Image Preview before Sending */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageBtn}>
                <Icon name="x" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Message Composer */}
          <View style={styles.composerBar}>
            <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
              <Icon name="camera" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TextInput
              style={styles.composerInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || (!inputText.trim() && !selectedImage)}
              style={[
                styles.sendBtn,
                (!inputText.trim() && !selectedImage || sending) && styles.sendBtnDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Conversations List View
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.screenSubtitle}>INTERNAL CHAT & SUPPORT</Text>
            <Text style={styles.screenTitle}>Messenger</Text>
          </View>
          <TouchableOpacity style={styles.newChatBtn} onPress={openNewChatModal}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.newChatBtnText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isSelected && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[styles.tabItemText, isSelected && styles.tabItemTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={14} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Conversations List */}
        {loadingConvs ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingSubText}>Loading conversations...</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.convList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="message-square" size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No Conversations Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try another search query' : 'Tap "+ New Chat" to start messaging team members'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const displayName = item.name || item.other_user?.full_name || 'Chat';
              const lastText = item.last_message?.message_text || 'No messages yet';
              const hasUnread = (item.unread_count || 0) > 0;
              const isPinned = item.is_pinned;

              return (
                <TouchableOpacity
                  style={[styles.convCard, isPinned && styles.pinnedConvCard]}
                  onPress={() => openConversation(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, isPinned && styles.pinnedAvatar]}>
                    <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() || 'C'}</Text>
                  </View>

                  <View style={styles.convInfo}>
                    <View style={styles.convRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                        {isPinned && <Icon name="bookmark" size={12} color="#F59E0B" />}
                        <Text style={[styles.convTitle, hasUnread && styles.unreadTitle]} numberOfLines={1}>
                          {displayName}
                        </Text>
                      </View>
                      {item.last_message && (
                        <Text style={styles.convTime}>
                          {new Date(item.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </View>

                    <View style={styles.convRow}>
                      <Text style={[styles.lastMsgText, hasUnread && styles.unreadText]} numberOfLines={1}>
                        {maskSensitiveData(lastText)}
                      </Text>
                      {hasUnread && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Start New Chat Modal */}
        <Modal visible={newChatModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Conversation</Text>
                <TouchableOpacity onPress={() => setNewChatModalVisible(false)}>
                  <Icon name="x" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.contactSearchBox}>
                <Icon name="search" size={16} color={colors.textLight} />
                <TextInput
                  style={styles.contactSearchInput}
                  placeholder="Search staff, partners, or supervisors..."
                  placeholderTextColor={colors.textLight}
                  value={contactSearch}
                  onChangeText={handleSearchContacts}
                />
              </View>

              {loadingContacts || startingChat ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ marginTop: 8, fontSize: 12, color: colors.textMid }}>
                    {startingChat ? 'Connecting direct channel...' : 'Searching contacts...'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={contacts}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: 350 }}
                  ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: colors.textMid, fontSize: 13 }}>No contacts matching "{contactSearch}"</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.contactItem}
                      onPress={() => handleSelectContact(item)}
                      disabled={startingChat}
                    >
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>{(item.full_name || 'U')[0].toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.contactName}>{item.full_name}</Text>
                        <Text style={styles.contactSub}>
                          {item.role} {item.partner_code ? `• ${item.partner_code}` : ''} {item.employee_id ? `• ${item.employee_id}` : ''}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={16} color={colors.textLight} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 4,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  newChatBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 6,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItemActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMid,
  },
  tabItemTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingSubText: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 8,
  },
  convList: {
    padding: spacing.md,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pinnedConvCard: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FEF3C7',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedAvatar: {
    backgroundColor: '#FEF3C7',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  convInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  convRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  unreadTitle: {
    fontWeight: '800',
    color: '#0F172A',
  },
  convTime: {
    fontSize: 10,
    color: colors.textLight,
  },
  lastMsgText: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 2,
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
    textAlign: 'center',
  },
  threadHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 4,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 4,
  },
  threadAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  threadTitleContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  threadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  threadSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  pinHeaderBtn: {
    padding: 6,
  },
  messagesList: {
    padding: spacing.md,
  },
  msgRow: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgBubble: {
    maxWidth: '82%',
    padding: 10,
    borderRadius: 14,
  },
  msgBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  msgBubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  senderName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextMe: {
    color: '#fff',
  },
  msgTextOther: {
    color: colors.text,
  },
  msgMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  msgTime: {
    fontSize: 9,
  },
  msgTimeMe: {
    color: '#E0E7FF',
  },
  msgTimeOther: {
    color: colors.textLight,
  },
  typingBox: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 11,
    color: colors.textMid,
    fontStyle: 'italic',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    left: 48,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: spacing.xs,
  },
  attachBtn: {
    padding: 8,
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxHeight: 80,
    fontSize: 13,
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  contactSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: spacing.sm,
    gap: 6,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    padding: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  contactSub: {
    fontSize: 10,
    color: colors.textMid,
    marginTop: 1,
  },
});
