import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/Button';
import {
  fetchSuperAdminWalletOverview,
  fetchWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
} from '../../../services/super-admin.service';

export default function SuperAdminWalletScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  const [overview, setOverview] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Action Modal State
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [isApproving, setIsApproving] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [noteOrReason, setNoteOrReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, withdrawalsRes] = await Promise.all([
        fetchSuperAdminWalletOverview().catch(() => null),
        fetchWithdrawalRequests({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }).catch(() => ({ data: [] })),
      ]);

      if (overviewRes?.data || overviewRes) {
        setOverview(overviewRes.data || overviewRes);
      }

      const list = Array.isArray(withdrawalsRes?.data)
        ? withdrawalsRes.data
        : Array.isArray(withdrawalsRes?.withdrawals)
        ? withdrawalsRes.withdrawals
        : Array.isArray(withdrawalsRes)
        ? withdrawalsRes
        : [];
      setWithdrawals(list);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const handleAction = async () => {
    if (!selectedWithdrawal) return;
    try {
      setProcessing(true);
      if (isApproving) {
        await approveWithdrawalRequest(selectedWithdrawal.id, noteOrReason || 'Approved by Super Admin');
        Alert.alert('Approved', `Withdrawal of ₹${selectedWithdrawal.amount} approved`);
      } else {
        if (!noteOrReason.trim()) {
          Alert.alert('Required', 'Please enter a reason for rejection');
          setProcessing(false);
          return;
        }
        await rejectWithdrawalRequest(selectedWithdrawal.id, noteOrReason);
        Alert.alert('Rejected', `Withdrawal request rejected`);
      }
      setActionModalVisible(false);
      loadWalletData();
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const filterTabs = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'ALL', label: 'All Requests' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>SUPER ADMIN</Text>
          <Text style={styles.headerTitle}>Wallet & Settlements</Text>
        </View>
      </View>

      {/* Financial KPI Banner */}
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Pending Settlements</Text>
          <Text style={[styles.overviewAmount, { color: '#F59E0B' }]}>
            ₹{(overview?.pending_payouts || overview?.pendingWithdrawalAmount || 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.overviewSub}>
            {overview?.pending_count || withdrawals.filter((w) => (w.status || '').toUpperCase() === 'PENDING').length} Requests awaiting action
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.miniKpi}>
            <Text style={styles.miniKpiLabel}>Total Disbursed</Text>
            <Text style={styles.miniKpiValue}>
              ₹{(overview?.total_paid_out || overview?.totalPaidOut || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.miniKpi}>
            <Text style={styles.miniKpiLabel}>System Escrow</Text>
            <Text style={styles.miniKpiValue}>
              ₹{(overview?.system_balance || overview?.escrowBalance || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterBtn, statusFilter === tab.key && styles.activeFilterBtn]}
            onPress={() => setStatusFilter(tab.key as any)}
          >
            <Text style={[styles.filterBtnText, statusFilter === tab.key && styles.activeFilterBtnText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Withdrawals List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settlements...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {withdrawals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="credit-card" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Withdrawal Requests</Text>
              <Text style={styles.emptyDesc}>No requests match the {statusFilter.toLowerCase()} filter.</Text>
            </View>
          ) : (
            withdrawals.map((req) => {
              const status = (req.status || 'PENDING').toUpperCase();
              const isPending = status === 'PENDING';

              let badgeBg = '#FEF3C7';
              let badgeColor = '#B45309';
              if (status === 'APPROVED' || status === 'PAID') {
                badgeBg = '#DCFCE7';
                badgeColor = '#15803D';
              } else if (status === 'REJECTED') {
                badgeBg = '#FEE2E2';
                badgeColor = '#B91C1C';
              }

              return (
                <Card key={req.id} style={styles.reqCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>₹</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.partnerName}>{req.partner_name || req.user_name || 'Partner'}</Text>
                      <Text style={styles.reqSub}>
                        {req.partner_code ? `Code: ${req.partner_code} • ` : ''}
                        {new Date(req.created_at || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{status}</Text>
                    </View>
                  </View>

                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Requested Amount</Text>
                    <Text style={styles.amountValue}>₹{(req.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>

                  {/* Bank Info */}
                  <View style={styles.bankBox}>
                    <Text style={styles.bankLabel}>Bank Details</Text>
                    <Text style={styles.bankValue}>
                      {req.bank_name || 'Bank'} • A/C: {req.account_number || '••••••••'}
                    </Text>
                    <Text style={styles.bankSub}>IFSC: {req.ifsc_code || 'N/A'}</Text>
                  </View>

                  {/* Action Buttons */}
                  {isPending && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => {
                          setSelectedWithdrawal(req);
                          setIsApproving(false);
                          setNoteOrReason('');
                          setActionModalVisible(true);
                        }}
                      >
                        <Icon name="x" size={14} color="#fff" />
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#10B981', flex: 2 }]}
                        onPress={() => {
                          setSelectedWithdrawal(req);
                          setIsApproving(true);
                          setNoteOrReason('');
                          setActionModalVisible(true);
                        }}
                      >
                        <Icon name="check" size={14} color="#fff" />
                        <Text style={styles.actionBtnText}>Approve & Pay</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Confirmation Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isApproving ? 'Approve Settlement' : 'Reject Settlement'}
            </Text>
            <Text style={styles.modalSub}>
              {isApproving
                ? `Confirm payout of ₹${selectedWithdrawal?.amount} to ${selectedWithdrawal?.partner_name || 'partner'}.`
                : `Specify the reason for rejecting this payout request.`}
            </Text>

            <Text style={styles.inputLabel}>
              {isApproving ? 'Transaction Reference / Notes (Optional)' : 'Rejection Reason (Required)'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={noteOrReason}
              onChangeText={setNoteOrReason}
              placeholder={isApproving ? 'e.g. UTR12345678 or NEFT ref' : 'e.g. Invalid bank details / account mismatch'}
              multiline={!isApproving}
              numberOfLines={isApproving ? 1 : 3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setActionModalVisible(false)}
                disabled={processing}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: isApproving ? '#10B981' : '#EF4444' },
                ]}
                onPress={handleAction}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {isApproving ? 'Confirm Approval' : 'Reject Request'}
                  </Text>
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
  overviewContainer: {
    padding: spacing.md,
    backgroundColor: '#0F172A',
    gap: spacing.sm,
  },
  overviewCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
  },
  overviewLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  overviewAmount: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  overviewSub: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniKpi: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: spacing.sm,
  },
  miniKpiLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  miniKpiValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterBtn: {
    backgroundColor: `${colors.primary}15`,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeFilterBtnText: {
    color: colors.primary,
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
  },
  reqCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  reqSub: {
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
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textMid,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  bankBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  bankLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  bankValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  bankSub: {
    fontSize: 11,
    color: colors.textMid,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
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
    marginBottom: spacing.md,
    color: colors.text,
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
    color: colors.textMid,
  },
  modalConfirmBtn: {
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
