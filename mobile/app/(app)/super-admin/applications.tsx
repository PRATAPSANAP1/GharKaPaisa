import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/Icon';
import {
  fetchSuperAdminApplications,
  approveApplication,
  rejectApplication,
} from '../../../services/super-admin.service';

export default function SuperAdminApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Action state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'DETAILS' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const statuses = ['ALL', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'];

  const loadApplications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter.toLowerCase();

      const res = await fetchSuperAdminApplications(params);
      const list = Array.isArray(res) ? res : res.data || res.applications || [];
      setApplications(list);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await approveApplication(selectedApp.id || selectedApp._id, actionReason);
      Alert.alert('Success', 'Application approved successfully');
      setActionType(null);
      setSelectedApp(null);
      loadApplications();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!actionReason.trim()) {
      Alert.alert('Validation', 'Please enter a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      await rejectApplication(selectedApp.id || selectedApp._id, actionReason);
      Alert.alert('Success', 'Application marked as rejected');
      setActionType(null);
      setSelectedApp(null);
      loadApplications();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || 'SUBMITTED';
    switch (s) {
      case 'APPROVED':
      case 'DISBURSED':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'IN_REVIEW':
      case 'PROCESSING':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#E0F2FE', text: '#0369A1' };
    }
  };

  const renderAppCard = ({ item }: { item: any }) => {
    const sBadge = getStatusBadge(item.status);
    const appId = item.application_no || item.id || item._id;

    return (
      <Card style={styles.appCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.appNumber}>APP #{String(appId).slice(-8)}</Text>
            <Text style={styles.customerName}>{item.customer_name || item.fullName || 'Applicant'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sBadge.bg }]}>
            <Text style={[styles.statusText, { color: sBadge.text }]}>
              {item.status?.toUpperCase() || 'SUBMITTED'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.gridCol}>
            <Text style={styles.label}>Product & Bank</Text>
            <Text style={styles.val} numberOfLines={1}>
              {item.bank_name || 'Bank'} • {item.product_name || item.product_type || 'Credit Card'}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.label}>Partner / Agent</Text>
            <Text style={styles.val} numberOfLines={1}>{item.partner_name || item.agent_name || 'Direct Lead'}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.label}>Phone / Mobile</Text>
            <Text style={styles.val}>{item.mobile || item.phone || 'N/A'}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.label}>PAN / Income</Text>
            <Text style={styles.val}>{item.pan_number || item.pan || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => {
              setSelectedApp(item);
              setActionType('DETAILS');
            }}
          >
            <Icon name="eye" size={14} color="#475569" />
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>

          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => {
                setSelectedApp(item);
                setActionReason('');
                setActionType('REJECT');
              }}
            >
              <Icon name="x" size={14} color="#DC2626" />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => {
                setSelectedApp(item);
                setActionReason('');
                setActionType('APPROVE');
              }}
            >
              <Icon name="check" size={14} color="#16A34A" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Applications Control</Text>
          <Text style={styles.headerSubtitle}>Super admin loan & credit card review</Text>
        </View>
      </View>

      {/* Search & Status Filters */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputWrap}>
          <Icon name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer name, phone, PAN, or app #..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadApplications()}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === item && styles.activeFilterChip]}
              onPress={() => setStatusFilter(item)}
            >
              <Text style={[styles.filterChipText, statusFilter === item && styles.activeFilterChipText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching live applications...</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          renderItem={renderAppCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadApplications(true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Icon name="inbox" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySub}>No records match current filter criteria.</Text>
            </View>
          }
        />
      )}

      {/* Action Modal (Approve / Reject / Details) */}
      <Modal visible={!!actionType} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'APPROVE' && 'Approve Application'}
                {actionType === 'REJECT' && 'Reject Application'}
                {actionType === 'DETAILS' && 'Application Overview'}
              </Text>
              <TouchableOpacity onPress={() => setActionType(null)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {actionType === 'DETAILS' && selectedApp && (
              <View style={styles.detailsModalBody}>
                <Text style={styles.detailRow}>
                  <Text style={styles.bold}>Applicant: </Text>
                  {selectedApp.customer_name || selectedApp.fullName}
                </Text>
                <Text style={styles.detailRow}>
                  <Text style={styles.bold}>Mobile: </Text>
                  {selectedApp.mobile || selectedApp.phone}
                </Text>
                <Text style={styles.detailRow}>
                  <Text style={styles.bold}>Email: </Text>
                  {selectedApp.email || 'N/A'}
                </Text>
                <Text style={styles.detailRow}>
                  <Text style={styles.bold}>Bank & Product: </Text>
                  {selectedApp.bank_name} - {selectedApp.product_name}
                </Text>
                <Text style={styles.detailRow}>
                  <Text style={styles.bold}>Current Status: </Text>
                  {selectedApp.status?.toUpperCase()}
                </Text>
                {selectedApp.remarks ? (
                  <Text style={styles.detailRow}>
                    <Text style={styles.bold}>Remarks: </Text>
                    {selectedApp.remarks}
                  </Text>
                ) : null}
              </View>
            )}

            {(actionType === 'APPROVE' || actionType === 'REJECT') && (
              <View>
                <Text style={styles.modalLabel}>
                  {actionType === 'APPROVE' ? 'Approval Remarks (Optional):' : 'Rejection Reason (Required):'}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={actionType === 'APPROVE' ? 'e.g. Verified by Super Admin' : 'e.g. Low CIBIL score / Invalid PAN'}
                  placeholderTextColor="#94A3B8"
                  value={actionReason}
                  onChangeText={setActionReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActionType(null)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>

              {actionType === 'APPROVE' && (
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#16A34A' }]}
                  onPress={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitText}>Confirm Approve</Text>}
                </TouchableOpacity>
              )}

              {actionType === 'REJECT' && (
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#DC2626' }]}
                  onPress={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitText}>Confirm Reject</Text>}
                </TouchableOpacity>
              )}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  searchBarWrap: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: spacing.xs,
    fontSize: 14,
    color: '#1E293B',
  },
  filterList: {
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  activeFilterChip: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  listContent: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: '#64748B',
  },
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  appNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  gridCol: {
    width: '50%',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  val: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.xs,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    gap: 4,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    gap: 4,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailsModalBody: {
    marginBottom: spacing.md,
  },
  detailRow: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: '#1E293B',
    height: 70,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
