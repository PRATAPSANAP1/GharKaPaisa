import React, { useState, useEffect, useRef } from 'react';
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
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
  getConversations,
  getMessages,
  sendMessage,
  sendMessageWithAttachment,
  markRead,
  MessengerConversation,
  MessengerMessage
} from '../../services/messenger.service';

import { AppState } from 'react-native';
import { getMessengerSocket } from '../../services/messengerSocket';

export default function MessengerScreen() {
  const { user, userRole } = useAuth();
  const [conversations, setConversations] = useState<MessengerConversation[]>([]);
  const [activeConv, setActiveConv] = useState<MessengerConversation | null>(null);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const activeConvRef = useRef<MessengerConversation | null>(null);
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  const fetchConvs = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvs(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    fetchConvs();

    // Subscribe to Socket.IO real-time updates (no polling loop)
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

        // 2. Incrementally update conversation list without refetching all
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
            // New conversation arrived, fetch updated list
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

      const handleTypingUpdate = (data: { conversation_id: string; user_id: string; user_name: string; is_typing: boolean }) => {
        if (!data) return;
        if (activeConvRef.current?.id === data.conversation_id && String(data.user_id).toLowerCase() !== String(user?.id).toLowerCase()) {
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
  }, []);

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
      console.error(e);
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
          message_type: 'TEXT'
        });
      }
      if (sent) {
        setMessages(prev => [...prev, sent]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
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

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConvs();
  };

  // If viewing a single conversation thread
  if (activeConv) {
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
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.threadTitleContainer}>
              <Text style={styles.threadTitle} numberOfLines={1}>
                {activeConv.name || activeConv.other_user?.full_name || 'Conversation'}
              </Text>
              <Text style={styles.threadSubtitle}>
                {activeConv.conversation_type}
              </Text>
            </View>
          </View>

          {/* Messages Stream */}
          {loadingMsgs ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
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
                const isImage = attachment && (attachment.file_type?.startsWith('image/') || attachment.file_name?.match(/\.(jpg|jpeg|png|gif)$/i));

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
                          {item.message_text}
                        </Text>
                      )}
                      <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Message Composer */}
          <View style={styles.composerBar}>
            <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
              <Text style={styles.attachBtnText}>📷</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.composerInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || (!inputText.trim() && !selectedImage)}
              style={[styles.sendBtn, (!inputText.trim() && !selectedImage || sending) && styles.sendBtnDisabled]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity onPress={removeSelectedImage} style={styles.removeImageBtn}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Conversations List View
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.listHeader}>
          <Text style={styles.screenTitle}>Messenger</Text>
          <Text style={styles.screenSubtitle}>Real-time internal chat & support</Text>
        </View>

        {loadingConvs ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.convList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                <Text style={styles.emptyText}>Start messaging team members or support directly.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const displayName = item.name || item.other_user?.full_name || 'Chat';
              const lastText = item.last_message?.message_text || 'No messages yet';
              const hasUnread = (item.unread_count || 0) > 0;

              return (
                <TouchableOpacity style={styles.convCard} onPress={() => openConversation(item)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.convInfo}>
                    <View style={styles.convRow}>
                      <Text style={[styles.convTitle, hasUnread && styles.unreadTitle]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      {item.last_message && (
                        <Text style={styles.convTime}>
                          {new Date(item.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </View>
                    <View style={styles.convRow}>
                      <Text style={[styles.lastMsgText, hasUnread && styles.unreadText]} numberOfLines={1}>
                        {lastText}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  listHeader: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  screenTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  screenSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  convList: {
    padding: spacing.sm
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: typography.weights.bold
  },
  convInfo: {
    flex: 1
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  convTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flex: 1
  },
  unreadTitle: {
    color: colors.primary
  },
  convTime: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginLeft: 6
  },
  lastMsgText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    flex: 1
  },
  unreadText: {
    color: colors.text,
    fontWeight: typography.weights.bold
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 6
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: typography.weights.bold
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center'
  },

  // Thread styles
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backBtn: {
    paddingRight: spacing.md
  },
  backText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold
  },
  threadTitleContainer: {
    flex: 1
  },
  threadTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  threadSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight
  },
  messagesList: {
    padding: spacing.md
  },
  msgRow: {
    marginBottom: spacing.md,
    flexDirection: 'row'
  },
  msgRowLeft: {
    justifyContent: 'flex-start'
  },
  msgRowRight: {
    justifyContent: 'flex-end'
  },
  msgBubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16
  },
  msgBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2
  },
  msgBubbleOther: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 2
  },
  senderName: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: 2
  },
  msgText: {
    fontSize: typography.sizes.sm,
    lineHeight: 18
  },
  msgTextMe: {
    color: '#fff'
  },
  msgTextOther: {
    color: colors.text
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  msgTimeMe: {
    color: 'rgba(255,255,255,0.7)'
  },
  msgTimeOther: {
    color: colors.textLight
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: typography.sizes.sm,
    color: colors.text
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginLeft: spacing.sm
  },
  sendBtnDisabled: {
    opacity: 0.5
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs
  },
  attachBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginRight: spacing.sm
  },
  attachBtnText: {
    fontSize: 20
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: spacing.xs
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  removeImageBtn: {
    marginLeft: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: typography.weights.bold
  }
});
