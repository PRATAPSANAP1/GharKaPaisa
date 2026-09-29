import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { ApplicationItem } from '../../types';
import {
  fetchKycApplications,
  fetchGeneralApplicationsQueue,
  verifyKycApplication,
  rejectKycApplication,
  requestInfoKycApplication,
  updateKycStage,
  updateApplicationVerification,
  updateRemarkOperatorRemark,
  KycStats,
} from '../../services/operations.service';
import { OperationalQueueCard } from '../../components/operations/OperationalQueueCard';
import { QueueHeader } from '../../components/operations/QueueHeader';
import { QueueFilterSheet } from '../../components/operations/QueueFilterSheet';
import { LoadingState } from '../../components/LoadingState';
import { Button } from '../../components/Button';

export default function OperationalQueueScreen() {
  const { user, userRole, userDesignation } = useAuth();
  const searchParams = useLocalSearchParams<{ queue?: string }>();

  // Determine active workspace mode
  const desigUpper = (userDesignation || '').toUpperCase();
  const roleUpper = (userRole || '').toUpperCase();
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN';

  // State for active queue tab (for Admins / Super Admins)
  const initialMode = searchParams.queue || (
    desigUpper.includes('KYC') ? 'KYC' :
    desigUpper.includes('PAN') ? 'PAN' :
    desigUpper.includes('QD') ? 'QD' :
    desigUpper.includes('REMARK') ? 'REMARK' :
    desigUpper.includes('FINAL') ? 'FINAL' : 'ALL'
  );
  const [activeQueueTab, setActiveQueueTab] = useState<string>(initialMode);

  // Listing State
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [kycStats, setKycStats] = useState<KycStats | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  // Action Modal State
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [vkycStageInput, setVkycStageInput] = useState('');
  const [bankRefInput, setBankRefInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Concurrency & Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actionPayload: () => Promise<void>;
  }>({ visible: false, title: '', message: '', actionPayload: async () => {} });

  const isFetchingRef = useRef(false);
  const searchTimeoutRef = useRef<any>(null);

  // Debounce search input (400ms)
  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setAppliedSearch(text.trim());
      setPage(1);
    }, 400);
  };

  // Main Queue Fetching Logic
  const loadQueueData = useCallback(async (targetPage: number, resetList = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setErrorMsg(null);

    if (targetPage === 1 && !refreshing) {
      setLoading(true);
    }

    try {
      const params = {
        page: targetPage,
        limit: 15,
        search: appliedSearch || undefined,
        ...activeFilters,
      };

      let result;
      if (activeQueueTab === 'KYC' || desigUpper.includes('KYC')) {
        result = await fetchKycApplications(params);
        setKycStats(result.stats);
      } else {
        // Fetch general queue filtered for PAN, QD, REMARK, FINAL, or ALL
        let statusFilter = activeFilters.status;
        if (!statusFilter) {
          if (activeQueueTab === 'PAN') statusFilter = 'details_submitted';
          else if (activeQueueTab === 'QD') statusFilter = 'details_submitted';
          else if (activeQueueTab === 'REMARK') statusFilter = 'details_submitted';
          else if (activeQueueTab === 'FINAL') statusFilter = 'operational_verified';
        }

        result = await fetchGeneralApplicationsQueue({
          ...params,
          status: statusFilter,
        });
      }

      if (result.success) {
        if (resetList || targetPage === 1) {
          setApplications(result.data);
        } else {
          setApplications(prev => [...prev, ...result.data]);
        }

        setTotalCount(result.pagination.total);
        setHasMore(targetPage < result.pagination.totalPages);
        setPage(targetPage);
      }
    } catch (err: any) {
      console.error('[OpQueue] Load error:', err);
      if (err.response?.status === 429) {
        setErrorMsg('Too many requests. Please wait a moment and try again.');
      } else if (err.response?.status === 403) {
        setErrorMsg('Access Denied: You do not have permission for this operational queue.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to load operational queue.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [activeQueueTab, appliedSearch, activeFilters, desigUpper]);

  useEffect(() => {
    loadQueueData(1, true);
  }, [loadQueueData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueueData(1, true);
  };

  const loadMore = () => {
    if (hasMore && !isFetchingRef.current && !loading) {
      loadQueueData(page + 1);
    }
  };

  // Open Action Modal for chosen action
  const handleOpenAction = (app: ApplicationItem, type: string) => {
    setSelectedApp(app);
    setActionType(type);
    setActionRemarks('');
    setVkycStageInput(app.vkyc_stage || app.kyc_stage || '');
    setBankRefInput(app.bank_application_number || '');
  };

  // Execute Action Submission
  const submitOperatorAction = async () => {
    if (!selectedApp || !actionType) return;
    setSubmittingAction(true);

    try {
      const appId = selectedApp.id;

      if (actionType === 'VERIFY_KYC') {
        await verifyKycApplication(appId, actionRemarks);
        Alert.alert('Success', 'KYC Verified successfully!');
      } else if (actionType === 'REJECT_KYC') {
        if (!actionRemarks.trim()) {
          Alert.alert('Required', 'Rejection reason is required');
          setSubmittingAction(false);
          return;
        }
        await rejectKycApplication(appId, actionRemarks);
        Alert.alert('Success', 'KYC Rejected');
      } else if (actionType === 'REQUEST_INFO_KYC') {
        if (!actionRemarks.trim()) {
          Alert.alert('Required', 'Details are required for info request');
          setSubmittingAction(false);
          return;
        }
        await requestInfoKycApplication(appId, actionRemarks);
        Alert.alert('Success', 'Requested additional info');
      } else if (actionType === 'UPDATE_KYC_STAGE') {
        await updateKycStage(appId, {
          vkyc_stage: vkycStageInput,
          kyc_remarks: actionRemarks,
          bank_application_number: bankRefInput || undefined,
        });
        Alert.alert('Success', 'KYC Stage Updated');
      } else if (actionType === 'VERIFY_PAN') {
        await updateApplicationVerification(appId, {
          status: 'operational_verified',
          user_remark: actionRemarks || 'PAN Verified by PAN Checker',
          backend_remark: actionRemarks,
        });
        Alert.alert('Success', 'PAN Verified successfully');
      } else if (actionType === 'UPDATE_QD') {
        await updateApplicationVerification(appId, {
          user_remark: actionRemarks || 'QD Updated by Operator',
          bank_application_number: bankRefInput || undefined,
        });
        Alert.alert('Success', 'QD Information Saved');
      } else if (actionType === 'UPDATE_REMARK') {
        await updateRemarkOperatorRemark(appId, {
          bank_remark: actionRemarks,
          user_remark: actionRemarks,
        });
        Alert.alert('Success', 'Remark Saved');
      } else if (actionType === 'APPROVE_FINAL') {
        await updateApplicationVerification(appId, {
          status: 'approved',
          final_status: 'Approved',
          user_remark: actionRemarks || 'Approved by Final Status Operator',
          bank_remark: actionRemarks || 'Approved by Final Status Operator',
        });
        Alert.alert('Success', 'Application Approved');
      } else if (actionType === 'DECLINE_FINAL') {
        if (!actionRemarks.trim()) {
          Alert.alert('Required', 'Decline reason is required');
          setSubmittingAction(false);
          return;
        }
        await updateApplicationVerification(appId, {
          status: 'rejected',
          final_status: 'Rejected',
          decline_reason: actionRemarks,
          user_remark: actionRemarks,
        });
        Alert.alert('Success', 'Application Declined');
      }

      // Refresh Queue after action
      setSelectedApp(null);
      setActionType(null);
      loadQueueData(1, true);
    } catch (err: any) {
      console.error('[OpQueue] Action error:', err);
      Alert.alert('Action Failed', err.response?.data?.message || 'Failed to process operator action');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Helper for Final Status Confirmation Dialog
  const triggerFinalActionConfirmation = (app: ApplicationItem, statusType: 'APPROVE' | 'DECLINE') => {
    setSelectedApp(app);
    if (statusType === 'APPROVE') {
      setActionType('APPROVE_FINAL');
      setConfirmDialog({
        visible: true,
        title: 'Approve Application',
        message: `Are you sure you want to APPROVE application ${app.app_number || app.bank_application_number}?`,
        actionPayload: async () => submitOperatorAction(),
      });
    } else {
      setActionType('DECLINE_FINAL');
      handleOpenAction(app, 'DECLINE_FINAL');
    }
  };

  const getWorkspaceTitle = () => {
    if (desigUpper.includes('KYC')) return 'KYC Operator Queue';
    if (desigUpper.includes('PAN')) return 'PAN Checker Review Desk';
    if (desigUpper.includes('QD')) return 'QD Operator Verification Queue';
    if (desigUpper.includes('REMARK')) return 'Remark Operator Desk';
    if (desigUpper.includes('FINAL')) return 'Final Status Approval Desk';
    return 'Operational Applications Hub';
  };

  return (
    <View style={styles.container}>
      {/* Queue Header */}
      <QueueHeader
        title={getWorkspaceTitle()}
        subtitle={`Role: ${userRole}${userDesignation ? ' • ' + userDesignation : ''}`}
        totalCount={totalCount}
        pendingCount={kycStats?.pending_kyc}
        verifiedCount={kycStats?.verified_kyc}
        searchValue={search}
        onSearchChange={handleSearchChange}
        onFilterPress={() => setIsFilterVisible(true)}
        hasActiveFilters={Object.keys(activeFilters).length > 0}
      />

      {/* Admin Queue Selector Bar */}
      {(isSuperAdmin || roleUpper === 'ADMIN') && (
        <View style={styles.adminBar}>
          {['ALL', 'KYC', 'PAN', 'QD', 'REMARK', 'FINAL'].map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.adminTab, activeQueueTab === q && styles.adminTabActive]}
              onPress={() => setActiveQueueTab(q)}
            >
              <Text style={[styles.adminTabText, activeQueueTab === q && styles.adminTabTextActive]}>
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main List / Error State */}
      {loading && page === 1 ? (
        <LoadingState message="Loading operational queue applications..." />
      ) : errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Button title="Retry Queue" onPress={() => loadQueueData(1, true)} variant="outline" style={{ marginTop: spacing.sm }} />
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <OperationalQueueCard
              item={item}
              userDesignation={userDesignation}
              onPress={() => router.push({ pathname: '/(app)/application-details', params: { id: item.id } })}
              onAction={type => {
                if (type === 'FINAL_STATUS') {
                  triggerFinalActionConfirmation(item, 'APPROVE');
                } else {
                  handleOpenAction(item, type);
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Operational Queue Empty</Text>
              <Text style={styles.emptyText}>No applications currently match your assigned workspace filters.</Text>
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <QueueFilterSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={activeFilters}
        onApply={filters => {
          setActiveFilters(filters);
          setPage(1);
        }}
        onReset={() => {
          setActiveFilters({});
          setPage(1);
        }}
      />

      {/* Action Modal */}
      <Modal visible={Boolean(actionType)} animationType="slide" transparent onRequestClose={() => setActionType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Action: {actionType?.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.modalSub}>
              App #{selectedApp?.app_number || selectedApp?.bank_application_number}
            </Text>

            {actionType === 'UPDATE_KYC_STAGE' && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={styles.inputLabel}>VKYC / Bio Stage</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. VKYC_COMPLETED, Bio Pending..."
                  placeholderTextColor={colors.textLight}
                  value={vkycStageInput}
                  onChangeText={setVkycStageInput}
                />
              </View>
            )}

            {(actionType === 'UPDATE_KYC_STAGE' || actionType === 'UPDATE_QD') && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={styles.inputLabel}>Bank Ref Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Bank Application Number..."
                  placeholderTextColor={colors.textLight}
                  value={bankRefInput}
                  onChangeText={setBankRefInput}
                />
              </View>
            )}

            <Text style={styles.inputLabel}>Remarks / Audit Note</Text>
            <TextInput
              style={[styles.textInput, { height: 80 }]}
              placeholder="Enter remarks or justification..."
              placeholderTextColor={colors.textLight}
              value={actionRemarks}
              onChangeText={setActionRemarks}
              multiline
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setActionType(null)} variant="outline" style={{ flex: 1 }} />
              <Button
                title={submittingAction ? 'Saving...' : 'Submit Action'}
                onPress={submitOperatorAction}
                disabled={submittingAction}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={confirmDialog.visible} animationType="fade" transparent onRequestClose={() => setConfirmDialog(p => ({ ...p, visible: false }))}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{confirmDialog.title}</Text>
            <Text style={styles.modalSub}>{confirmDialog.message}</Text>
            <View style={styles.modalActions}>
              <Button title="No, Cancel" onPress={() => setConfirmDialog(p => ({ ...p, visible: false }))} variant="outline" style={{ flex: 1 }} />
              <Button
                title="Yes, Confirm"
                onPress={async () => {
                  setConfirmDialog(p => ({ ...p, visible: false }));
                  await confirmDialog.actionPayload();
                }}
                style={{ flex: 1 }}
              />
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
  adminBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  adminTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.radius.sm,
    backgroundColor: colors.inputBg,
  },
  adminTabActive: {
    backgroundColor: colors.primary,
  },
  adminTabText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  adminTabTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  errorBox: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: spacing.radius.md,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: spacing.radius.lg,
    padding: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.extrabold,
    color: colors.text,
  },
  modalSub: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMid,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
