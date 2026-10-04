import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/Button';
import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '../../../services/super-admin.service';

export default function SuperAdminAnnouncementsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Create Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'PARTNER' | 'EMPLOYEE'>('ALL');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAnnouncements();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.announcements)
        ? res.announcements
        : Array.isArray(res)
        ? res
        : [];
      setAnnouncements(list);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in both title and message.');
      return;
    }
    try {
      setSubmitting(true);
      await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        target_audience: targetAudience,
        priority: priority,
      });
      setCreateModalVisible(false);
      setTitle('');
      setMessage('');
      Alert.alert('Published', 'Announcement broadcasted successfully.');
      loadAnnouncements();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, annTitle: string) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${annTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnouncement(id);
              Alert.alert('Deleted', 'Announcement removed');
              loadAnnouncements();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete announcement');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>SUPER ADMIN</Text>
          <Text style={styles.headerTitle}>Broadcast Center</Text>
        </View>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Icon name="plus" size={18} color="#fff" />
          <Text style={styles.headerActionText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Announcements List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching broadcasts...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {announcements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="bell" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Broadcasts Yet</Text>
              <Text style={styles.emptyDesc}>
                Tap the "+ New" button above to publish an announcement to partners and employees.
              </Text>
            </View>
          ) : (
            announcements.map((ann) => {
              const p = (ann.priority || 'NORMAL').toUpperCase();
              let priorityBg = '#F1F5F9';
              let priorityColor = '#475569';
              if (p === 'URGENT') {
                priorityBg = '#FEE2E2';
                priorityColor = '#DC2626';
              } else if (p === 'HIGH') {
                priorityBg = '#FEF3C7';
                priorityColor = '#D97706';
              }

              return (
                <Card key={ann.id} style={styles.annCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityBg }]}>
                      <Text style={[styles.priorityText, { color: priorityColor }]}>{p}</Text>
                    </View>
                    <View style={styles.audienceBadge}>
                      <Icon name="users" size={12} color={colors.primary} />
                      <Text style={styles.audienceText}>
                        {(ann.target_audience || 'ALL').toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(ann.id, ann.title)}
                    >
                      <Icon name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.annTitle}>{ann.title}</Text>
                  <Text style={styles.annMessage}>{ann.message || ann.content}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                      Published:{' '}
                      {new Date(ann.created_at || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Create Announcement Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Broadcast</Text>
            <Text style={styles.modalSub}>
              Send an instant announcement to partners and staff.
            </Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. System Maintenance / Payout Schedule"
            />

            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your broadcast message here..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Target Audience</Text>
            <View style={styles.toggleRow}>
              {(['ALL', 'PARTNER', 'EMPLOYEE'] as const).map((aud) => (
                <TouchableOpacity
                  key={aud}
                  style={[
                    styles.toggleBtn,
                    targetAudience === aud && styles.activeToggleBtn,
                  ]}
                  onPress={() => setTargetAudience(aud)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      targetAudience === aud && styles.activeToggleText,
                    ]}
                  >
                    {aud === 'ALL' ? 'All' : aud === 'PARTNER' ? 'Partners' : 'Staff'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Priority Level</Text>
            <View style={styles.toggleRow}>
              {(['NORMAL', 'HIGH', 'URGENT'] as const).map((pr) => (
                <TouchableOpacity
                  key={pr}
                  style={[
                    styles.toggleBtn,
                    priority === pr && styles.activeToggleBtn,
                  ]}
                  onPress={() => setPriority(pr)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      priority === pr && styles.activeToggleText,
                    ]}
                  >
                    {pr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Publish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.md,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  headerActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textMid,
  },
  contentList: {
    flex: 1,
    padding: spacing.md,
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
    marginTop: spacing.md,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  annCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  annTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  annMessage: {
    fontSize: 13,
    color: colors.textMid,
    marginTop: 4,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 10,
    color: colors.textLight,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  activeToggleBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMid,
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMid,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
