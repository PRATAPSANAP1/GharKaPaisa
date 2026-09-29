import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Icon } from '../../components/Icon';
import { chatbotService } from '../../services/chatbot.service';
import { fetchCurrentUser } from '../../services/auth.service';
import { ChatMessage, ChatChipAction, UserProfile } from '../../types';

export default function FinanceBuddyScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  const flatListRef = useRef<FlatList>(null);

  // Initialize Session & Profile
  useEffect(() => {
    const newSessionId = `mob_session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    setSessionId(newSessionId);

    // Fetch user profile for role awareness
    fetchCurrentUser()
      .then((res: { success: boolean; user?: UserProfile }) => {
        if (res?.success && res.user) {
          setUserProfile(res.user);
          initWelcomeMessage(res.user);
        } else {
          initWelcomeMessage(null);
        }
      })
      .catch(() => {
        initWelcomeMessage(null);
      });
  }, []);

  const initWelcomeMessage = (profile: UserProfile | null) => {
    const roleName = profile?.role ? profile.role.replace('_', ' ') : 'Guest';
    const name = profile?.full_name || profile?.name || '';
    const greeting = name ? `Hello ${name}!` : 'Hello!';

    const initialChips: ChatChipAction[] = [
      { label: '💳 Find Credit Card', action: 'cards_start' },
      { label: '📋 Process Lead', action: 'lead_process' },
      { label: '📄 My Applications', action: 'go_partner_applications' },
      { label: '🛍️ Explore Products', action: 'go_partner_products' },
      { label: '📞 Support Helpline', action: 'go_contact' },
    ];

    const welcomeMsg: ChatMessage = {
      id: 'welcome_msg_01',
      sender: 'assistant',
      text: `${greeting} Welcome to GharKaPaisa Finance Buddy (${roleName}).\n\nI am your AI assistant for credit cards, loans, payouts, and lead management. How can I assist you today?`,
      timestamp: formatTime(new Date()),
      chips: initialChips,
    };

    setMessages([welcomeMsg]);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputText).trim();
    if (!messageText || sending) return;

    // Clear input if sending typed text
    if (!textToSend) {
      setInputText('');
    }

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: messageText,
      timestamp: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    scrollToBottom();

    try {
      const res = await chatbotService.sendMessage(messageText, sessionId);

      const botMsgId = `bot_${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'assistant',
        text: res.message || 'I have processed your query.',
        timestamp: formatTime(new Date()),
        chips: res.chips,
        category: res.category,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const is429 = err.response?.status === 429;
      let errorText = 'Sorry, something went wrong while processing your query. Please try again.';

      if (is429) {
        errorText = 'Too many requests. Please wait a moment before sending another query.';
        // Preserve typed message in input so user doesn't lose text
        if (!textToSend) {
          setInputText(messageText);
        }
      } else if (err.response?.status === 403) {
        errorText = 'Access restricted. You do not have permission for this action.';
      }

      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: errorText,
        timestamp: formatTime(new Date()),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const handleChipClick = async (chip: ChatChipAction) => {
    if (sending) return;

    // Check Navigation Triggers
    const actionKey = chip.action.toLowerCase();
    let handledNavigation = false;

    if (actionKey === 'go_partner_applications' || actionKey === 'go_employee_applications' || actionKey === 'go_applications') {
      router.push('/applications');
      handledNavigation = true;
    } else if (actionKey === 'go_partner_add_lead' || actionKey === 'go_add_lead') {
      router.push('/add-lead');
      handledNavigation = true;
    } else if (actionKey === 'go_partner_products' || actionKey === 'go_employee_cards' || actionKey === 'go_cards') {
      router.push('/products');
      handledNavigation = true;
    } else if (actionKey === 'go_partner_wallet' || actionKey === 'go_employee_incentives') {
      router.push('/wallet');
      handledNavigation = true;
    } else if (actionKey === 'go_partner_team') {
      router.push('/team');
      handledNavigation = true;
    }

    // Append user selection as a message bubble
    const userMsg: ChatMessage = {
      id: `chip_user_${Date.now()}`,
      sender: 'user',
      text: chip.label,
      timestamp: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    scrollToBottom();

    try {
      const res = await chatbotService.handleAction(chip.action, chip.label, sessionId);

      const botMsg: ChatMessage = {
        id: `chip_bot_${Date.now()}`,
        sender: 'assistant',
        text: res.message || `Processed ${chip.label}`,
        timestamp: formatTime(new Date()),
        chips: res.chips,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const is429 = err.response?.status === 429;
      const errorText = is429
        ? 'Too many requests. Please wait a moment before performing another action.'
        : 'Failed to process request. Please try again.';

      const errorMsg: ChatMessage = {
        id: `chip_err_${Date.now()}`,
        sender: 'assistant',
        text: errorText,
        timestamp: formatTime(new Date()),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const handleResetChat = async () => {
    if (sending) return;
    try {
      await chatbotService.resetConversation(sessionId);
    } catch (err) {}
    const newSessionId = `mob_session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    setSessionId(newSessionId);
    initWelcomeMessage(userProfile);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.botWrapper]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble, item.isError && styles.errorBubble]}>
          {!isUser && (
            <View style={styles.botAvatarRow}>
              <Icon name="shield" size={14} color={colors.primary} />
              <Text style={styles.botAvatarTitle}>Finance Buddy</Text>
            </View>
          )}

          <Text style={[styles.messageText, isUser ? styles.userText : styles.botText, item.isError && styles.errorText]}>
            {item.text}
          </Text>

          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
            {item.timestamp}
          </Text>
        </View>

        {/* Quick Action Chips */}
        {!isUser && item.chips && item.chips.length > 0 && (
          <View style={styles.chipsContainer}>
            {item.chips.map((chip, idx) => (
              <TouchableOpacity
                key={`chip_${idx}_${chip.action}`}
                style={styles.chipButton}
                onPress={() => handleChipClick(chip)}
                disabled={sending}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={18} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Finance Buddy</Text>
            <View style={styles.onlineBadgeRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>AI Assistant • Online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetChat} disabled={sending}>
          <Icon name="clock" size={14} color={colors.primary} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Feed */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feed}
        onContentSizeChange={scrollToBottom}
      />

      {/* Typing Indicator */}
      {sending && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>Finance Buddy is thinking...</Text>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Finance Buddy..."
          placeholderTextColor={colors.textLight}
          value={inputText}
          onChangeText={setInputText}
          editable={!sending}
          multiline={false}
          onSubmitEditing={() => handleSendMessage()}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="arrow-up-right" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  onlineText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.bg,
  },
  resetText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  feed: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageWrapper: {
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  botWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  botBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBubble: {
    borderColor: colors.error,
    backgroundColor: '#FEF2F2',
  },
  botAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  botAvatarTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  messageText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: colors.text,
  },
  errorText: {
    color: colors.error,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  botTimestamp: {
    color: colors.textLight,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chipButton: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typingText: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: colors.inputBg,
    borderRadius: 21,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
