import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Announcement {
  id: string;
  announcement_id?: string;
  title: string;
  short_description?: string;
  content?: string;
  priority?: string;
  status?: string;
  audience_type?: string;
  target_role?: string;
  creator_name?: string;
  reach?: number;
  views?: number;
  created_at: string;
  published_at?: string;
  expires_at?: string;
}

export default function ViewMessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { admin: 'true' };
      if (filter !== 'all') params.status = filter;
      const response = await apiClient.get('/notifications/broadcast', { params });
      const payload = response.data?.data;
      setMessages(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      await apiClient.post(`/notifications/announcements/${announcementId}/read`);
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      Alert.alert('Error', 'Failed to mark message as read');
    }
  };

  const isUnread = (item: Announcement) => !item.views;

  const getPriorityColor = (priority?: string) => {
    switch ((priority || '').toUpperCase()) {
      case 'URGENT':
      case 'HIGH':
        return '#EF4444';
      case 'MEDIUM':
        return '#F59E0B';
      case 'LOW':
        return '#10B981';
      default:
        return colors.primary;
    }
  };

  const filteredMessages = messages;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'publish', 'draft', 'scheduled', 'expired'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f && styles.filterChipTextActive
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.messagesContainer}>
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages found</Text>
          </View>
        ) : (
          filteredMessages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageCard,
                isUnread(message) && styles.unreadCard
              ]}
            >
              <View style={styles.messageHeader}>
                <View style={styles.senderInfo}>
                  <Text style={styles.senderName}>{message.creator_name || 'Super Admin'}</Text>
                  <Text style={styles.messageDate}>
                    {new Date(message.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.unreadBadge,
                    { backgroundColor: getPriorityColor(message.priority) }
                  ]}
                >
                  <Text style={styles.unreadBadgeText}>
                    {(message.priority || message.status || 'INFO').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.messageSubject}>{message.title}</Text>
              <Text style={styles.messageContent} numberOfLines={3}>
                {message.short_description || message.content || ''}
              </Text>

              <Text style={styles.expiresText}>
                Reach: {message.reach ?? 0} • Views: {message.views ?? 0}
                {message.expires_at
                  ? ` • Expires: ${new Date(message.expires_at).toLocaleDateString()}`
                  : ''}
              </Text>

              <View style={styles.messageActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleMarkAsRead(message.announcement_id || message.id)}
                >
                  <Text style={styles.actionButtonText}>Mark as Read</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: typography.sizes.sm,
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.card,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  messagesContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
  },
  messageCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  messageDate: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  messageSubject: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: 6,
  },
  messageContent: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  expiresText: {
    fontSize: typography.sizes.xs,
    color: '#F59E0B',
    marginBottom: 12,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
});
