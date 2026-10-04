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
  fetchContestsList,
  createContest,
} from '../../../services/super-admin.service';

export default function SuperAdminContestsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contests, setContests] = useState<any[]>([]);

  // Create Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetCount, setTargetCount] = useState('10');
  const [rewardAmount, setRewardAmount] = useState('5000');
  const [submitting, setSubmitting] = useState(false);

  const loadContests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchContestsList();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.contests)
        ? res.contests
        : Array.isArray(res)
        ? res
        : [];
      setContests(list);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load contests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContests();
  }, [loadContests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadContests();
  };

  const handleCreateContest = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter contest title');
      return;
    }
    try {
      setSubmitting(true);
      await createContest({
        title: title.trim(),
        description: description.trim(),
        target_count: parseInt(targetCount) || 10,
        reward_amount: parseFloat(rewardAmount) || 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setCreateModalVisible(false);
      setTitle('');
      setDescription('');
      Alert.alert('Created', 'New contest created and published to partners!');
      loadContests();
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Could not create contest');
    } finally {
      setSubmitting(false);
    }
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
          <Text style={styles.headerTitle}>Sales Contests</Text>
        </View>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Icon name="plus" size={18} color="#fff" />
          <Text style={styles.headerActionText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Contests List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading contests...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {contests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="award" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Active Contests</Text>
              <Text style={styles.emptyDesc}>
                Tap the "+ New" button to launch a sales leaderboard or partner incentive contest.
              </Text>
            </View>
          ) : (
            contests.map((c) => {
              const isActive = (c.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
              return (
                <Card key={c.id} style={styles.contestCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.trophyIcon}>
                      <Icon name="award" size={22} color="#D97706" />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.contestTitle}>{c.title || c.name}</Text>
                      <Text style={styles.contestSub}>
                        Target: {c.target_count || c.target || 10} Disbursals / Card sales
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isActive ? '#15803D' : '#64748B' },
                        ]}
                      >
                        {isActive ? 'ACTIVE' : 'EXPIRED'}
                      </Text>
                    </View>
                  </View>

                  {c.description && (
                    <Text style={styles.contestDesc}>{c.description}</Text>
                  )}

                  <View style={styles.rewardRow}>
                    <View style={styles.rewardBox}>
                      <Text style={styles.rewardLabel}>Grand Prize</Text>
                      <Text style={styles.rewardValue}>
                        ₹{(c.reward_amount || c.reward || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.rewardBox}>
                      <Text style={styles.rewardLabel}>Participants</Text>
                      <Text style={styles.rewardValue}>
                        {c.participants_count || c.total_participants || 0}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateRange}>
                      Duration:{' '}
                      {new Date(c.start_date || Date.now()).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(c.end_date || Date.now()).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Create Contest Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Contest</Text>
            <Text style={styles.modalSub}>
              Launch a motivational sales leaderboard with prizes for top performers.
            </Text>

            <Text style={styles.inputLabel}>Contest Title</Text>
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Diwali Super Achiever Challenge"
            />

            <Text style={styles.inputLabel}>Description & Rules</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Top 3 partners with max credit card disbursals get cash bonus."
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Target Count</Text>
                <TextInput
                  style={styles.modalInput}
                  value={targetCount}
                  onChangeText={setTargetCount}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Reward Amount (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rewardAmount}
                  onChangeText={setRewardAmount}
                  keyboardType="numeric"
                  placeholder="5000"
                />
              </View>
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
                onPress={handleCreateContest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Publish Contest</Text>
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
  contestCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contestTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  contestSub: {
    fontSize: 11,
    color: colors.textMid,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  contestDesc: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  rewardRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  rewardBox: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  rewardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  cardFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateRange: {
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
