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
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import {
  fetchCandidatesList,
  convertCandidateToEmployee,
  rejectCandidate,
} from '../../services/super-admin.service';
import apiClient from '../../services/api';

export default function HRDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [filterStage, setFilterStage] = useState('ALL');

  // Interview Schedule Modal
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchCandidatesList();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setCandidates(list);
    } catch (err: any) {
      console.warn('Failed to load HR candidates:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCandidates();
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate) return;
    setScheduling(true);
    try {
      await apiClient.post(`/hr/candidates/${selectedCandidate.id}/interview`, {
        interview_date: interviewDate,
        notes: interviewNotes.trim(),
      });
      setInterviewModalVisible(false);
      Alert.alert('Scheduled', `Interview scheduled for ${selectedCandidate.full_name}`);
      loadCandidates();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not schedule interview');
    } finally {
      setScheduling(false);
    }
  };

  const handleSelectCandidate = async (candidate: any) => {
    Alert.alert(
      'Select & Convert Candidate',
      `Approve ${candidate.full_name} for joining?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Candidate',
          onPress: async () => {
            try {
              await convertCandidateToEmployee(candidate.id, {
                designation: candidate.target_role || 'TC',
                offeredSalary: candidate.expected_salary || 18000,
              });
              Alert.alert('Selected', `${candidate.full_name} is now approved for employee onboarding.`);
              loadCandidates();
            } catch (err: any) {
              Alert.alert('Failed', err.message || 'Could not select candidate');
            }
          },
        },
      ]
    );
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filterStage === 'ALL') return true;
    return (c.status || '').toUpperCase() === filterStage;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>TALENT ACQUISITION</Text>
          <Text style={styles.headerTitle}>HR Recruitment Desk</Text>
        </View>
      </View>

      {/* KPI Counters */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{candidates.length}</Text>
          <Text style={styles.kpiLabel}>Total Pipeline</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#3B82F6' }]}>
          <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>
            {candidates.filter((c) => (c.status || '').toUpperCase().includes('INTERVIEW')).length}
          </Text>
          <Text style={styles.kpiLabel}>Interviews</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#10B981' }]}>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            {candidates.filter((c) => (c.status || '').toUpperCase().includes('SELECT') || (c.status || '').toUpperCase().includes('APPROVED')).length}
          </Text>
          <Text style={styles.kpiLabel}>Selected</Text>
        </View>
      </View>

      {/* Stage Filter */}
      <View style={styles.stageFilterRow}>
        {['ALL', 'APPLIED', 'INTERVIEW', 'SELECTED'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.stageBtn, filterStage === st && styles.activeStageBtn]}
            onPress={() => setFilterStage(st)}
          >
            <Text style={[styles.stageBtnText, filterStage === st && styles.activeStageBtnText]}>
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Candidates List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching candidates...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {filteredCandidates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="users" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Candidates Found</Text>
              <Text style={styles.emptyDesc}>New career applicants will appear here.</Text>
            </View>
          ) : (
            filteredCandidates.map((cand) => (
              <Card key={cand.id} style={styles.candCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(cand.full_name || 'C').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.candName}>{cand.full_name}</Text>
                    <Text style={styles.candRole}>
                      {cand.reference_code || cand.id?.substring(0, 8)} • {cand.target_role || 'Sales Associate'}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{(cand.status || 'APPLIED').toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>📱 {cand.mobile_number}</Text>
                  <Text style={styles.metaText}>📍 {cand.city || 'India'}</Text>
                  <Text style={styles.metaText}>💰 ₹{(cand.expected_salary || 18000).toLocaleString('en-IN')}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                    onPress={() => {
                      setSelectedCandidate(cand);
                      setInterviewModalVisible(true);
                    }}
                  >
                    <Icon name="calendar" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Schedule Interview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => handleSelectCandidate(cand)}
                  >
                    <Icon name="check" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Select</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Schedule Interview Modal */}
      <Modal visible={interviewModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule Interview</Text>
            <Text style={styles.modalSub}>
              Set interview date and notes for {selectedCandidate?.full_name}.
            </Text>

            <Text style={styles.inputLabel}>Interview Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={interviewDate}
              onChangeText={setInterviewDate}
              placeholder="e.g. 2026-10-06"
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.inputLabel}>Interviewer Notes / Instructions</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              value={interviewNotes}
              onChangeText={setInterviewNotes}
              placeholder="e.g. Telephonic round / Video KYC test"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setInterviewModalVisible(false)}
                disabled={scheduling}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleScheduleInterview}
                disabled={scheduling}
              >
                {scheduling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Schedule</Text>
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
    backgroundColor: '#0B1120',
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
  kpiRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: '#1E293B',
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
    fontWeight: '600',
  },
  stageFilterRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 4,
  },
  stageBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeStageBtn: {
    backgroundColor: colors.primary,
  },
  stageBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeStageBtnText: {
    color: '#fff',
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
    color: '#fff',
    marginTop: spacing.md,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  candCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  candName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  candRole: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  badge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: '#0F172A',
    padding: spacing.xs,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.textLight,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  modalSub: {
    fontSize: 12,
    color: colors.textLight,
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
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: spacing.md,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
